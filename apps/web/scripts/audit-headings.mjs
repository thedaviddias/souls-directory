#!/usr/bin/env node
/**
 * Static audit: find all heading usage (h1–h6 and SectionHeader as=) in app + components.
 * Use for review; for runtime per-page validation run:
 *   pnpm --filter @souls-directory/e2e test:e2e tests/accessibility-headings.spec.ts
 *
 * Usage: node apps/web/scripts/audit-headings.mjs
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const APP = join(ROOT, 'app')
const COMPONENTS = join(ROOT, 'components')

function* walkTsx(dir, prefix = '') {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '_generated' || e.name === '__tests__') continue
      yield* walkTsx(join(dir, e.name), rel)
    } else if (e.name.endsWith('.tsx')) {
      yield { path: join(dir, e.name), rel }
    }
  }
}

function audit() {
  const findings = { h1: [], h2: [], h3: [], sectionHeaderAs: [], sectionHeaderDefault: [] }

  for (const { path: filePath, rel } of [...walkTsx(APP), ...walkTsx(COMPONENTS)]) {
    const content = readFileSync(filePath, 'utf8')
    const lines = content.split('\n')

    // SectionHeader as= can be on same line or next lines (exclude section-header.tsx itself — it only defines the type)
    const hasSectionHeader = content.includes('SectionHeader')
    if (hasSectionHeader && /as=["']h1["']/.test(content) && !rel.includes('section-header.tsx'))
      findings.sectionHeaderAs.push({ file: rel, level: 'h1' })
    if (hasSectionHeader && /as=["']h2["']/.test(content))
      findings.sectionHeaderAs.push({ file: rel, level: 'h2' })
    if (hasSectionHeader && /as=["']h3["']/.test(content))
      findings.sectionHeaderAs.push({ file: rel, level: 'h3' })

    lines.forEach((line, i) => {
      const lineNum = i + 1
      if (/<h1[\s>]/.test(line))
        findings.h1.push({ file: rel, line: lineNum, snippet: line.trim().slice(0, 80) })
      if (/<h2[\s>]/.test(line)) findings.h2.push({ file: rel, line: lineNum })
      if (/<h3[\s>]/.test(line)) findings.h3.push({ file: rel, line: lineNum })
      if (/<SectionHeader/.test(line) && !/\bas=/.test(line))
        findings.sectionHeaderDefault.push({ file: rel, line: lineNum })
    })
  }

  return findings
}

const f = audit()

console.log('=== Heading audit (static) ===\n')
console.log('h1 (each page should have exactly one):')
for (const { file, line, snippet } of f.h1) {
  console.log(`  ${file}:${line}  ${snippet}`)
}
console.log('')

if (f.sectionHeaderAs.some((x) => x.level === 'h1')) {
  console.log('⚠️  SectionHeader with as="h1" (avoid when page already has an h1):')
  for (const { file } of f.sectionHeaderAs.filter((x) => x.level === 'h1')) {
    console.log(`  ${file}`)
  }
  console.log('')
}

console.log(
  'SectionHeader with explicit as (h2/h3):',
  f.sectionHeaderAs.filter((x) => x.level !== 'h1').length
)
console.log('SectionHeader (default h2):', f.sectionHeaderDefault.length)
console.log('')
console.log('For per-page heading order (one h1, no skipped levels), run:')
console.log('  pnpm --filter @souls-directory/e2e test:e2e tests/accessibility-headings.spec.ts')
console.log('')

const h1Count = f.h1.length
if (h1Count > 10)
  console.log(
    `Note: ${h1Count} h1 usages found; they live in shared components used by different pages. E2E test validates each rendered page.`
  )
process.exit(f.sectionHeaderAs.some((x) => x.level === 'h1') ? 1 : 0)
