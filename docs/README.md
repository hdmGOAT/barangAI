# LihokBarangAI — E2E Tests

## How to run

```bash
pnpm --filter web test:e2e
```

This runs all page/render/navigation tests with **mock auth** enabled by default — no real Supabase Auth credentials needed.

The app starts automatically (port 3000) with `VITE_ENABLE_MOCK_AUTH=true`, which makes the app treat the user as authenticated with a mock profile:

- **Name:** Juan Dela Cruz
- **Role:** Brgy. Captain
- **Email:** test@example.com

Supabase data queries still run if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. Empty tables show empty states.

## Two modes

### Mock auth (default)

Set `VITE_ENABLE_MOCK_AUTH=true` (done automatically by `playwright.config.ts`).

Tests covered:
- Page rendering
- Sidebar navigation
- Dashboard content
- Incidents, Map, Reports, Settings pages
- Command center page
- Buttons and forms don't crash
- Empty states render correctly

No real Supabase Auth user required.

### Real auth (optional)

Only runs when both `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` are set in the environment.

```bash
# Start the app WITHOUT mock auth
VITE_ENABLE_MOCK_AUTH=false pnpm --filter web dev

# In another terminal, run with credentials
E2E_USER_EMAIL=admin@barangay.gov.ph E2E_USER_PASSWORD=secret pnpm --filter web test:e2e
```

Tests covered:
- Login form renders
- Invalid credentials show error
- Valid login redirects to dashboard
- Authenticated user visiting /login redirects
- Sign out redirects to /login

Requires a real Supabase Auth user with a matching `profiles` row.

## Credential setup

Create `apps/web/.env.local` or set env vars in CI:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Real auth only:

```
E2E_USER_EMAIL=admin@barangay.gov.ph
E2E_USER_PASSWORD=secret
```

## CI

The `.github/workflows/e2e.yml` workflow runs with mock auth by default (no credentials needed).

## Debugging

```bash
# UI mode (interactive)
pnpm --filter web test:e2e:ui

# Headed mode (see the browser)
pnpm --filter web test:e2e:headed

# Debug mode (step through)
pnpm --filter web test:e2e:debug
```

Artifacts (traces, screenshots, videos) are saved to `apps/web/test-results/`.
Reports are saved to `apps/web/playwright-report/`.
