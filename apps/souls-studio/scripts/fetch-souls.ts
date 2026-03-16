#!/usr/bin/env npx tsx

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as yaml from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface SoulRepository {
  owner: string
  repo: string
  branch?: string
  soulsPath?: string
}

interface SoulIndexEntry {
  id: string
  name: string
  description: string
  owner: string
  repo: string
  path: string
  localPath: string
}

interface SoulIndex {
  version: string
  lastUpdated: string
  repositories: SoulRepository[]
  souls: SoulIndexEntry[]
}

// Load repositories from catalog.json
const CATALOG_PATH = path.join(__dirname, '..', 'library', 'catalog.json')

function loadRepositoriesFromCatalog(): SoulRepository[] {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.log('Warning: catalog.json not found, using defaults')
    return []
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'))
  return catalog.repos.map((entry: { url: string }) => {
    const [owner, repo] = entry.url.split('/')
    // Determine soulsPath based on known patterns
    const soulsPath = getSoulsPath(owner, repo)
    return { owner, repo, soulsPath }
  })
}

function getSoulsPath(owner: string, repo: string): string {
  if (repo.endsWith('-soul')) {
    return '.'
  }

  // Most repos use souls/ folder; legacy repositories may still use skills/.
  return 'souls/'
}

const REPOSITORIES: SoulRepository[] = loadRepositoriesFromCatalog()

const LIBRARY_PATH = path.join(__dirname, '..', 'library')
const SOULS_PATH = path.join(LIBRARY_PATH, 'souls')
const INDEX_PATH = path.join(LIBRARY_PATH, 'index.json')

function fetchRepository(repo: SoulRepository): void {
  const repoPath = path.join(SOULS_PATH, repo.owner, repo.repo)
  const repoUrl = `https://github.com/${repo.owner}/${repo.repo}.git`

  if (fs.existsSync(repoPath)) {
    console.log(`Updating ${repo.owner}/${repo.repo}...`)
    try {
      execSync('git pull', { cwd: repoPath, stdio: 'inherit' })
    } catch (e) {
      console.log(`  Warning: Could not pull ${repo.owner}/${repo.repo}`)
    }
  } else {
    console.log(`Cloning ${repo.owner}/${repo.repo}...`)
    fs.mkdirSync(path.dirname(repoPath), { recursive: true })
    try {
      execSync(`git clone --depth 1 ${repoUrl} ${repoPath}`, { stdio: 'inherit' })
    } catch (e) {
      console.log(`  Warning: Could not clone ${repo.owner}/${repo.repo}`)
    }
  }
}

interface ParsedSoul {
  name: string
  description: string
  license?: string
}

function parseSoulFile(filePath: string): ParsedSoul | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) return null

    const frontmatter = yaml.parse(frontmatterMatch[1])
    return {
      name: frontmatter.name || path.basename(path.dirname(filePath)),
      description: frontmatter.description || '',
      license: frontmatter.license,
    }
  } catch {
    return null
  }
}

function findSoulFile(dir: string): string | null {
  // Prefer SOUL.md, but keep compatibility with legacy SKILL.md repos.
  const possibleNames = ['SOUL.md', 'soul.md', 'Soul.md', 'SKILL.md', 'skill.md', 'Skill.md']
  for (const name of possibleNames) {
    const filePath = path.join(dir, name)
    if (fs.existsSync(filePath)) return filePath
  }
  return null
}

function findSouls(
  owner: string,
  repo: string,
  repoPath: string,
  soulsPath: string
): SoulIndexEntry[] {
  const souls: SoulIndexEntry[] = []

  // Case 1: Single soul at root level (soulsPath is ".")
  if (soulsPath === '.') {
    const soulFile = findSoulFile(repoPath)
    if (soulFile) {
      const parsed = parseSoulFile(soulFile)
      if (parsed) {
        souls.push({
          id: `${owner}/${repo}/${parsed.name}`,
          name: parsed.name,
          description: parsed.description,
          owner,
          repo,
          path: '.',
          localPath: path.relative(LIBRARY_PATH, repoPath),
        })
      }
    }
    return souls
  }

  // Case 2: Try souls/ folder
  const fullPath = path.join(repoPath, soulsPath)
  if (fs.existsSync(fullPath)) {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(fullPath, { withFileTypes: true })
    } catch {
      return souls
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const soulDir = path.join(fullPath, entry.name)
      const soulFile = findSoulFile(soulDir)

      if (!soulFile) continue

      const parsed = parseSoulFile(soulFile)
      if (!parsed) continue

      souls.push({
        id: `${owner}/${repo}/${parsed.name}`,
        name: parsed.name,
        description: parsed.description,
        owner,
        repo,
        path: entry.name,
        localPath: path.relative(LIBRARY_PATH, soulDir),
      })
    }
  }

  // Case 3: If no souls found, check root for a single soul
  if (souls.length === 0) {
    const rootSoulFile = findSoulFile(repoPath)
    if (rootSoulFile) {
      const parsed = parseSoulFile(rootSoulFile)
      if (parsed) {
        souls.push({
          id: `${owner}/${repo}/${parsed.name}`,
          name: parsed.name,
          description: parsed.description,
          owner,
          repo,
          path: '.',
          localPath: path.relative(LIBRARY_PATH, repoPath),
        })
      }
    }
  }

  return souls
}

async function main() {
  console.log('=== Souls Studio: Fetching Souls ===\n')

  // Create directories
  fs.mkdirSync(SOULS_PATH, { recursive: true })

  // Fetch all repositories
  console.log('Fetching repositories...\n')
  for (const repo of REPOSITORIES) {
    fetchRepository(repo)
  }

  console.log('\nIndexing souls...\n')

  // Build index
  const allSouls: SoulIndexEntry[] = []

  for (const repo of REPOSITORIES) {
    const repoPath = path.join(SOULS_PATH, repo.owner, repo.repo)
    if (!fs.existsSync(repoPath)) continue

    const souls = findSouls(repo.owner, repo.repo, repoPath, repo.soulsPath || 'souls/')
    allSouls.push(...souls)
    console.log(`Found ${souls.length} souls in ${repo.owner}/${repo.repo}`)
  }

  const index: SoulIndex = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    repositories: REPOSITORIES,
    souls: allSouls,
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2))
  console.log(`\nIndexed ${allSouls.length} total souls`)
  console.log(`Index saved to: ${INDEX_PATH}`)
}

main().catch(console.error)
