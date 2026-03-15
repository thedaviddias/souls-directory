# OpenClaw Official Notes

Source URLs:
- `https://github.com/openclaw/openclaw/blob/main/README.md`
- `https://github.com/openclaw/openclaw/blob/main/docs/reference/templates/SOUL.md`
- `https://github.com/openclaw/openclaw/blob/main/docs/reference/templates/IDENTITY.md`
- `https://github.com/openclaw/openclaw/blob/main/docs/reference/templates/BOOTSTRAP.md`

## Workspace Facts

- OpenClaw's README says the default workspace root is `~/.openclaw/workspace`.
- The README also lists `AGENTS.md`, `SOUL.md`, and `TOOLS.md` as injected prompt files.
- Workspace skills live under `~/.openclaw/workspace/skills/<skill>/SKILL.md`.

Implication: a `SOUL.md` should be readable as prompt text, not as product marketing copy.

## Official SOUL.md Shape

The official template uses this structure:

```md
# SOUL.md - Who You Are

_You're not a chatbot. You're becoming someone._

## Core Truths
## Boundaries
## Vibe
## Continuity
```

The official template emphasizes:

- usefulness without filler
- having opinions instead of bland neutrality
- being resourceful before asking
- earning trust through competence
- treating access to a user's life with care
- asking before risky external actions
- continuity through memory files and explicit self-updates

Implication: default to principle-driven prose. Do not turn `SOUL.md` into a compliance checklist unless the user explicitly wants a rigid specialist.

## Official IDENTITY.md Relationship

The official `IDENTITY.md` template captures:

- name
- creature
- vibe
- emoji
- avatar

Implication: `SOUL.md` is the internal character and behavioral stance. `IDENTITY.md` is the external presentation. If they clash, fix the mismatch or call it out.

## Official BOOTSTRAP.md Relationship

The official `BOOTSTRAP.md` frames first-run setup as a conversation that discovers:

- who the agent is
- who the user is
- how the agent should behave

It explicitly points the conversation toward `IDENTITY.md`, `USER.md`, and then `SOUL.md`.

Implication: for a brand-new workspace, it is valid to help the user discover the soul through dialogue instead of demanding a full spec up front.
