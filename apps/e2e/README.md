# E2E Tests

End-to-end tests for souls.directory using [Playwright](https://playwright.dev/).

## Prerequisites

1. Install Playwright browsers (first time only):
   ```bash
   pnpm --filter @souls-directory/e2e test:install
   ```

2. Make sure the web app is built or running:
   ```bash
   pnpm --filter @souls-directory/web dev
   ```

## Running Tests

### Quick smoke test (Chromium only)
```bash
pnpm --filter @souls-directory/e2e test:e2e:smoke
```

### Full test suite (all browsers)
```bash
pnpm --filter @souls-directory/e2e test:e2e
```

### Fast mode (Chromium only)
```bash
pnpm --filter @souls-directory/e2e test:e2e:fast
```

### Debug mode (headed browser with devtools)
```bash
pnpm --filter @souls-directory/e2e test:e2e:debug
```

### Interactive UI mode
```bash
pnpm --filter @souls-directory/e2e test:e2e:ui
```

### View test report
```bash
pnpm --filter @souls-directory/e2e report
```

## Test Structure

```
tests/
├── smoke.spec.ts   # Basic navigation and load tests
├── souls.spec.ts   # Soul pages, cards, filtering
└── api.spec.ts     # API endpoint validation
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Target URL for tests | `http://localhost:3000` |
| `CI` | Set in CI environment | - |

## CI Integration

Tests run automatically in GitHub Actions on push to `main` and PRs.

The workflow:
1. Starts the Next.js dev server
2. Waits for it to be ready
3. Runs Playwright tests
4. Uploads test artifacts on failure

## Writing New Tests

```typescript
import { expect, test } from '@playwright/test'

test('my new test', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/souls\.directory/)
})
```

See [Playwright docs](https://playwright.dev/docs/intro) for more.
