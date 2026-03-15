# souls.directory Publishing Notes

This file is based on the current repo behavior in:

- `apps/web/lib/upload-utils.ts`
- `apps/web/lib/categories.ts`
- `apps/web/content/guides/openclaw-soul-md-guide.mdx`

## Important Constraint

Frontmatter is optional for souls.directory, but if you include it, keep it simple.

The current parser extracts:

- `title`
- `description`
- `category`
- `tags`
- `tested_with`
- `author`

Use inline arrays for `tags` and `tested_with`.

Prefer:

```yaml
tags: [direct, coding, reviewer]
tested_with: [claude-sonnet-4.5, gpt-4.1]
```

Avoid multiline YAML arrays for upload metadata if you want the current parser to read them reliably.

## Best Body Structure for Import

The repo extracts metadata from the markdown body too:

- name: first `#` heading, with `SOUL.md - ` stripped if present
- tagline: italic line immediately after the heading
- description: `## Vibe` section

Best pattern:

```md
---
title: "Code Reviewer"
description: "A sharp, skeptical engineering reviewer."
category: "coding"
tags: [direct, rigorous, review]
tested_with: [claude-sonnet-4.5, gpt-4.1]
author: "Your Name"
---

# SOUL.md - Code Reviewer

_A sharp, skeptical engineering reviewer._

## Core Truths
...
```

## Category Slugs

Use one of these current slugs when adding `category`:

- `technical`
- `professional`
- `creative`
- `educational`
- `playful`
- `wellness`
- `coding`
- `productivity`
- `research`
- `communication`
- `support`
- `tools`
- `learning`
- `fun`
- `experimental`
- `art-decc0`

If unsure, `coding`, `technical`, `professional`, `creative`, or `research` are the safest common fits.

## Practical Publishing Rules

- Keep the tagline under roughly one sentence.
- Make `## Vibe` readable as a card description on its own.
- Do not stuff SEO keywords into the soul.
- Use tags for capabilities or flavor, not full sentences.
- Only list models in `tested_with` if they were actually tried or the user explicitly wants aspirational metadata.
- Keep the soul useful in OpenClaw even after adding publish metadata.
