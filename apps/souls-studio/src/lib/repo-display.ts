function applyCase(value: string, replacement: string): string {
  if (value === value.toUpperCase()) {
    return replacement.toUpperCase()
  }

  if (value[0] === value[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1)
  }

  return replacement
}

export function toSoulDisplaySegment(value: string): string {
  return value
    .replace(/skills/gi, (match) => applyCase(match, 'souls'))
    .replace(/skill/gi, (match) => applyCase(match, 'soul'))
}

export function toSoulDisplayRepo(owner: string, repo: string): string {
  return `${toSoulDisplaySegment(owner)}/${toSoulDisplaySegment(repo)}`
}
