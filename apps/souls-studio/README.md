<p align="center">
  <img src="src-tauri/icons/icon.png" width="128" height="128" alt="Souls Studio">
</p>

<h1 align="center">Souls Studio</h1>

<p align="center">
  A desktop app to browse, fetch, and install <a href="https://docs.anthropic.com/en/docs/claude-code">Claude Code</a> souls.
</p>

## About

Souls Studio makes it easy to discover and manage souls for Claude Code. Souls are reusable prompts and instructions that extend Claude's capabilities in specific domains like SwiftUI development, React best practices, debugging, and more.

## Features

- **Browse Souls** - Explore curated soul repositories from the community
- **Preview Content** - Read soul documentation with full markdown rendering
- **One-Click Install** - Install souls via CLI or direct copy to your local Claude folder
- **Custom Repositories** - Add any GitHub repository containing Claude souls
- **Favorites** - Right-click to favorite souls and repos for quick access
- **Search & Filter** - Find souls by name, description, or filter by status

## Screenshot

<p align="center">
  <img src="images/banner.png" alt="Souls Studio Screenshot" width="800">
</p>

## Development

```bash
bun install
bun tauri dev
```

## Build

```bash
bun tauri build
```

## Quality Tooling

### Playwright

```bash
pnpm test:e2e:install
pnpm test:e2e
```

### Cargo Tooling

Install once:

```bash
cargo install cargo-nextest cargo-audit cargo-deny tauri-driver
```

Run checks:

```bash
pnpm cargo:check
pnpm cargo:nextest
pnpm cargo:audit
pnpm cargo:deny
```

### Sentry (optional)

Set `VITE_SENTRY_DSN` for frontend events and `SENTRY_DSN` (or `TAURI_SENTRY_DSN`) for native Tauri events.

## Tech Stack

- [Tauri 2.0](https://tauri.app/) - Desktop app framework
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide](https://lucide.dev/) - Icons

## License

MIT
