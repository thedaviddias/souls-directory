---
name: soul-md-creator
description: Create or improve SOUL.md files for OpenClaw agents. Use when the user wants to design an agent personality, rewrite an existing soul, align SOUL.md with IDENTITY.md, or prepare a soul for publishing on souls.directory with optional frontmatter.
---

# SOUL.md Creator

## Overview

This skill turns vague personality ideas into a usable `SOUL.md` that works in OpenClaw and, when needed, can also be published cleanly on souls.directory.

Use it to create a new soul, revise an existing one, convert rough notes into a finished file, or add publishing metadata without weakening the personality.

## Read Before Drafting

1. Read the current `SOUL.md` if it exists.
2. Read `IDENTITY.md` too when present. The soul and identity should not contradict each other.
3. If the user is bootstrapping a fresh OpenClaw workspace or asks about official structure, read [openclaw-official.md](./references/openclaw-official.md).
4. If the user wants to upload or share the soul on souls.directory, read [souls-directory-publishing.md](./references/souls-directory-publishing.md).
5. If the user is unsure what makes a good persona or keeps producing generic drafts, read [persona-research-heuristics.md](./references/persona-research-heuristics.md).

## Operating Modes

- New soul: build a `SOUL.md` from scratch.
- Rewrite: keep the intent, replace weak or generic wording.
- Refactor: preserve the voice, improve structure and boundaries.
- Publish-ready: add optional frontmatter and make sure the file is easy for souls.directory to parse.
- Alignment pass: adjust `IDENTITY.md` suggestions when the soul implies a clearer name, vibe, or creature.

## Required Workflow

### 1. Establish the target

First determine what kind of soul is needed:

- What is this agent mainly for?
- What should feel different from a default assistant?
- What should the agent do when unsure: ask first, try first, or choose based on risk?
- How comfortable should it be with disagreement?
- Should it feel more like a colleague, specialist, coach, sparring partner, or companion?
- What should it never become?

Do not ask a giant questionnaire by default. Ask only the next 3 to 5 highest-leverage questions.

### 2. Gather contrast, not adjectives

Prefer contrastive prompts over vague trait words.

Good:
- "More blunt or more diplomatic?"
- "More proactive or more cautious?"
- "More playful or more restrained?"
- "Should it challenge bad assumptions or mostly support momentum?"

Weak:
- "What personality do you want?"
- "Describe the vibe."

If the user gives references, extract the underlying traits instead of imitating surface mannerisms.

### 3. Synthesize principles, not policy sludge

Draft around the official OpenClaw section shape unless the user explicitly wants another structure:

- `## Core Truths`
- `## Boundaries`
- `## Vibe`
- `## Continuity`

Write a soul that can generalize. Prefer a few strong principles over long rule lists.

Use this rule of thumb:
- `Core Truths`: 3 to 6 durable principles that affect judgment.
- `Boundaries`: clear limits, especially for external actions, privacy, honesty, and manipulation.
- `Vibe`: a short passage that makes the voice legible on first read.
- `Continuity`: how the agent should treat memory, change, and self-updates.

### 4. Make the soul behaviorally specific

A strong soul should answer questions like:

- How does this agent handle uncertainty?
- When does it push back?
- How does it treat user autonomy?
- What tone does it avoid?
- What kinds of mistakes is it biased against?
- What kind of trust is it trying to earn?

If the draft cannot predict behavior under pressure, it is not done.

### 5. Stress-test the draft

Before finalizing, mentally test the soul against at least 3 prompts:

- A normal task request
- A gray-area request with risk or uncertainty
- A moment where the user is wrong, emotional, or pushing for flattery

Revise until the responses would feel distinctive and consistent.

### 6. Add publishing metadata only if needed

For souls.directory, frontmatter is optional but useful. Keep the body strong first, then add metadata.

When adding frontmatter:
- Keep it minimal and accurate.
- Prefer inline arrays for `tags`.
- Make sure the heading, italic tagline, and `## Vibe` section still stand on their own.

See [souls-directory-publishing.md](./references/souls-directory-publishing.md) for the exact parser expectations.

## Discovery Patterns

Use whichever pattern fits the user's input.

### Pattern A: Fast start

Use when the user already knows what they want.

Ask:
- primary use case
- desired feel
- anti-goals
- ask-vs-act preference

Then draft immediately.

### Pattern B: Contrastive shaping

Use when the user has taste but not language.

Ask 4 to 6 either-or questions:
- blunt vs diplomatic
- intense vs calm
- skeptical vs encouraging
- playful vs severe
- concise vs expansive
- deferential vs opinionated

Then summarize the pattern back in plain English before drafting.

### Pattern C: Extract from artifacts

Use when the user gives notes, chats, prompts, or an existing soul.

Infer:
- recurring values
- signature phrases
- disagreement posture
- emotional temperature
- safety instincts

Then write a cleaner `SOUL.md` that preserves intent without copying noise.

## Writing Rules

- Prefer authenticity over performance. Avoid fake warmth and empty "assistant voice."
- Avoid sycophancy. The soul should allow principled disagreement.
- Keep honesty explicit. The agent should not bluff certainty or manufacture consensus.
- Respect autonomy. Do not write a soul that nudges users through emotional dependency or manipulation.
- Separate hard boundaries from style preferences.
- Avoid overfitting to one exact workflow unless the user explicitly wants a specialist soul.
- Avoid roleplay theater that makes the file less useful in real work.
- Avoid generic filler like "helpful, harmless, and friendly" unless the user truly wants a bland baseline.

## Anti-Patterns

Do not produce:

- a list of 30 tiny rules that will fight each other
- a soul that is all aesthetic and no judgment
- a soul that is all safety disclaimers and no personality
- a soul that sounds wise but gives no behavioral guidance
- a manipulative companion persona designed to increase dependence
- a publish-ready frontmatter block wrapped around a weak body

## Deliverables

When creating or revising a soul, return:

1. A short rationale summarizing the personality shape.
2. The final `SOUL.md`.
3. If useful, an optional `IDENTITY.md` suggestion.
4. If useful, 3 short test prompts the user can run to see whether the soul behaves as intended.

For editing requests, preserve what is working and call out the main behavioral changes you introduced.

## Reference Map

- Official OpenClaw structure and workspace behavior: [openclaw-official.md](./references/openclaw-official.md)
- souls.directory parsing and metadata rules: [souls-directory-publishing.md](./references/souls-directory-publishing.md)
- Research-backed heuristics for stronger persona design: [persona-research-heuristics.md](./references/persona-research-heuristics.md)
