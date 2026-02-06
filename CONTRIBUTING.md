# Contributing to souls.directory

Thanks for your interest in contributing! You can contribute souls (personality templates) through the website, or contribute code to the project.

---

## Contributing Souls

Souls are stored in the database and submitted through the website. There is no file-based or GitHub PR submission—all souls go live via the upload wizard.

### What Makes a Good Soul?

**Good souls are:**
- **Distinctive** — Has a clear, unique personality
- **Useful** — Solves a real need (work, creativity, learning, fun)
- **Well-documented** — Clear core truths, boundaries, and vibe
- **Example-rich** — Shows the personality in action
- **Tested** — You've actually used it and it works well

**Avoid:**
- Generic personalities ("helpful assistant")
- Offensive, discriminatory, or harmful content
- Duplicates of existing souls (check the site first)
- Extremely niche (unless exceptionally well-done)

### How to Submit a Soul

1. **Sign in** at [souls.directory](https://souls.directory) with GitHub.
2. Go to the **Upload** page (`/upload`).
3. **Choose a source:**
   - **File upload** — Drag and drop or select one or more `.md` files (e.g. your SOUL.md).
   - **GitHub import** — Paste a GitHub URL to a repo, folder, or file; the wizard will look for SOUL.md and fetch the content.
4. **Wizard steps:**
   - **Source** — Add your file(s) or GitHub URL.
   - **Review** — Preview the markdown content.
   - **Metadata** — Set name, slug, tagline, description, category, and tags. Many fields are auto-filled from your markdown (e.g. name from `# SOUL.md - Name`, tagline from the italic line).
   - **Publish** — Final review and publish. Your soul is stored in the database with versioning; you can edit or publish new versions later.

You can also **fork** an existing soul (from its page) or **edit** your own soul (upload page with `?slug=your-soul`).

### Checklist Before Publishing

- [ ] Name and tagline are clear and distinctive
- [ ] Description is concise (under ~120 characters for the short description)
- [ ] Category selected (see list below)
- [ ] 3–5 relevant tags selected
- [ ] Core truths, boundaries, and vibe are in the markdown
- [ ] You've tested the soul with at least one LLM
- [ ] No typos or grammar issues
- [ ] Slug is lowercase-with-hyphens and unique

### Categories

Categories are fixed in the database. When uploading, you choose one of:

| Category      | Description                                          |
|---------------|------------------------------------------------------|
| Technical     | Engineering, DevOps, security, and developer tools   |
| Professional  | Business, workplace, planning, and workflow          |
| Creative      | Writers, artists, copywriters, and translators       |
| Educational   | Teachers, tutors, study guides, and mentors           |
| Playful       | Games, entertainment, and quirky characters          |
| Wellness      | Mindful, supportive, and empathetic companions        |
| Research      | Analysis, fact-checking, and investigation            |
| Experimental  | Novel, unconventional, and boundary-pushing          |

Not sure which category? Pick the closest fit; you can change it when editing.

### Tags

Tags are predefined in the database. You select from the existing set (e.g. Coding, Writing, Productivity, Debugging, Creative, Education, Fun, Business, AI, Mentor, Coach, Developer, Design, Data, DevOps, Security, Wellness, Gaming, etc.). Only admins and moderators can add new tags. Choose 3–5 that best describe your soul.

### Review and Moderation

After you publish, your soul is live. The team may hide or remove content that violates our policies (see "What We Don't Accept" below). For quality or policy issues we may reach out to suggest changes.

### FAQs (Souls)

**Can I submit multiple souls?**  
Yes. Each soul is a separate entry; use the upload wizard for each.

**Can I update my soul later?**  
Yes. Go to Upload and use edit mode (`?slug=your-soul`) to change metadata or publish a new version with updated content.

**What if my soul is similar to an existing one?**  
Small variations are fine if they serve different needs. If it's too similar, we may suggest differentiating or consolidating.

**Do I keep copyright?**  
You retain copyright but grant souls.directory (and everyone) an MIT license to use and distribute your submission.

**Can I submit souls for specific domains (e.g. medical, legal)?**  
Yes, but include appropriate disclaimers and do not present the soul as giving professional advice.

---

## Contributing Code

We welcome contributions to the Next.js app, Convex backend, and tooling.

### Prerequisites

- **Node.js** >= 20.11.1
- **pnpm** 9 (package manager)
- **Git**

### Local Setup

```bash
git clone https://github.com/thedaviddias/souls-directory.git
cd souls-directory
pnpm install
cp .env.example .env.local
# Edit .env.local with your Convex and GitHub OAuth credentials (see .env.example)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server runs Next.js and Convex concurrently.

Required environment variables (see [.env.example](.env.example)): Convex (`NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOY_KEY`), GitHub OAuth (`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`), and optionally site URLs, analytics, rate limiting (KV), and Sentry.

### Tech Stack

- **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS**
- **Convex** (database and backend)
- **Convex Auth** (GitHub OAuth)
- **Biome** (lint and format)

For more architecture and conventions, see [CLAUDE.md](CLAUDE.md) and [README.md](README.md).

### CI and Local Checks

Every push to `main` and every pull request runs CI (see [.github/workflows/ci.yml](.github/workflows/ci.yml)): **lint**, **typecheck**, **test**, and **build**.

Run the same checks locally:

```bash
pnpm run lint       # Lint (Biome)
pnpm run typecheck  # TypeScript
pnpm run test       # Unit tests (Vitest)
pnpm run build      # Build all apps
```

Or in one go: `pnpm exec turbo run lint typecheck test build`.

CI uses pnpm and Turbo caches. Optionally, maintainers can enable [Vercel Remote Cache](https://vercel.com/docs/monorepos/remote-caching) via `TURBO_TOKEN` and `TURBO_TEAM` for faster runs.

---

## What We Don't Accept

- Souls that impersonate real people
- Offensive, discriminatory, or harmful content
- Marketing or promotional content disguised as souls
- Extremely low-effort submissions
- Duplicates without meaningful differentiation
- Anything illegal or unethical

---

## Need Help?

- **Questions?** [Open a discussion](https://github.com/thedaviddias/souls-directory/discussions)
- **Bug reports?** [Open an issue](https://github.com/thedaviddias/souls-directory/issues)
- **Discord:** [Join the community](https://discord.gg/clawd)

Thank you for contributing to souls.directory.
