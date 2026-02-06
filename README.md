# souls.directory

**Give your agent a soul.**

[![CI](https://github.com/thedaviddias/souls-directory/actions/workflows/ci.yml/badge.svg)](https://github.com/thedaviddias/souls-directory/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg)](#contributors)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

A curated directory of SOUL.md personality templates for AI agents.

## What is souls.directory?

souls.directory is a curated collection of AI personality templates (SOUL.md files) for [OpenClaw](https://openclaw.ai) agents. Instead of starting from scratch, pick a personality that fits your needs—or mix and match to create something new.

## Quick Start

**Browse:** Visit [souls.directory](https://souls.directory) to explore the collection.

**Use a soul:** Copy any SOUL.md from the website into your OpenClaw agent workspace, or use the raw content link on each soul’s page.

## What is a SOUL.md?

A soul file defines how an AI agent behaves: **core values**, **communication style**, **boundaries**, and **vibe**. The difference between a chatbot and a companion is personality—this directory helps you build companions.

## Contributing

We welcome contributions: new soul templates and improvements to the site. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for guidelines and the submission process. AI-assisted PRs are welcome.

## For Developers

**Tech stack:** Next.js 16, TypeScript, Tailwind CSS, Convex, GitHub OAuth, Vercel.

**Local setup:**

```bash
git clone https://github.com/thedaviddias/souls-directory.git
cd souls-directory
pnpm install
cp .env.example .env.local
# Add your Convex and GitHub OAuth credentials
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**Project structure:**

```
souls-directory/
├── apps/
│   ├── web/          # Next.js app (Convex, auth, souls UI)
│   └── e2e/          # Playwright E2E tests
└── .github/          # CI and workflows
```

## Contributors

Thanks to everyone who contributes souls and code.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="12.5%"><a href="https://thedaviddias.com/"><img src="https://avatars.githubusercontent.com/u/237229?v=4?s=80" width="80px;" alt="David Dias"/><br /><sub><b>David Dias</b></sub></a><br /><a href="https://github.com/thedaviddias/souls-directory/commits?author=thedaviddias" title="Code">💻</a></td>
      <td align="center" valign="top" width="12.5%"><a href="https://github.com/apps/github-actions"><img src="https://avatars.githubusercontent.com/in/15368?v=4?s=80" width="80px;" alt="github-actions[bot]"/><br /><sub><b>github-actions[bot]</b></sub></a><br /><a href="https://github.com/thedaviddias/souls-directory/commits?author=github-actions[bot]" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT — see [LICENSE](LICENSE). Soul templates submitted to the directory are contributed under the same license.
