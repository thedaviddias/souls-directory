/**
 * Sanitize soul content before storage: strip HTML, zero-width/invisible chars,
 * trim, and enforce max length. Ensures only safe text/markdown is stored.
 */

const SOUL_CONTENT_MAX_LENGTH = 300_000

// Zero-width and invisible Unicode characters to strip (same class as comments)
const ZERO_WIDTH_CHARS = '\u200B\u200C\u200D\uFEFF\u00AD\u2060'

/** Strip HTML tags; keeps only text. Simple regex for <...> */
const HTML_TAG_REGEX = /<\s*[^>]+>/g

/**
 * Sanitize soul content: remove HTML, zero-width chars, trim, cap length.
 * Returns the string to store. Caller must use this for both storage and sha256.
 */
export function sanitizeSoulContent(raw: string): string {
  let out = raw

  for (const c of ZERO_WIDTH_CHARS) {
    out = out.split(c).join('')
  }

  out = out.replace(HTML_TAG_REGEX, '')
  out = out.trim()

  if (out.length > SOUL_CONTENT_MAX_LENGTH) {
    out = out.slice(0, SOUL_CONTENT_MAX_LENGTH)
  }

  return out
}
