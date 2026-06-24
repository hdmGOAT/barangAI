# Supabase + E2E Issues Report

## Current Status

```
Playwright E2E result (mock-auth mode):
29 passed
12 skipped
0 failed
```

The E2E suite is technically **passing** with zero failures. However, 12 tests are skipped because Supabase data or schema is incomplete. The suite validates that the app shell, routing, and protected pages do not crash in mock-auth mode, but it does **not** yet validate full data-backed workflows.

---

## What Is Working

- **Mock auth** (`VITE_ENABLE_MOCK_AUTH=true`) works end-to-end:
  - `AuthProvider` returns a mock profile immediately (Juan Dela Cruz, Brgy. Captain)
  - Route guards in `__root.tsx` and `login.tsx` respect mock auth
  - All protected pages are accessible without real Supabase auth
- **App shell and sidebar navigation** render correctly on every protected page
- **Login page** renders in mock-auth mode (redirects to `/dashboard`)
- **Root redirect** (`/`) works (redirects to `/dashboard` or `/login`)
- **Page-level error states** are handled gracefully — pages show error UI instead of crashing
- **Dashboard**, **Incidents**, **Map**, **Command Center**, **Reports**, and **Settings** pages all render without fatal crashes
- **Filter controls**, **toggle groups**, **navigation links**, **buttons** are present on rendered pages
- **TypeScript**, **lint**, and **Vite build** all pass cleanly

---

## What Is Not Fully Verified Yet

- Dashboard stats from real Supabase data
- Incident CRUD or detail views
- Map markers from geocoded incidents
- Personnel roster or dispatch
- System log / broadcast workflows
- Report generation with real data
- Settings profile loaded from real auth
- Sign in / sign out with real Supabase Auth credentials
- RLS policy behavior
- Realtime subscriptions firing

---

## Root Cause — Single Unapplied Migration

**All schema gaps share a single root cause:** Migration `20240008_frontend_tables.sql` was defined in `supabase/migrations/` but **never applied** to the remote Supabase project.

**Schema inspection completed 2026-06-23** via direct REST API queries:

| Table | Remote Status | Equivalent Found? |
|---|---|---|
| `incidents` | ✅ Exists (7 cols from 20240005) | N/A |
| `reports` | ✅ Exists (29 cols from 20240002-004) | N/A |
| `raw_messages` | ✅ Exists (20240001) | N/A |
| `pending_clarifications` | ✅ Exists (20240003) | N/A |
| `personnel` | ❌ **Does not exist** | None (`responders`, `teams`, `patrols` not found) |
| `system_logs` | ❌ **Does not exist** | None (`activity_logs`, `audit_logs`, `events` not found) |
| `sms_reports` | ❌ **Does not exist** | None |
| `profiles` | ❌ **Does not exist** | None |
| `incidents.urgency` | ❌ **Does not exist** | None (`priority`, `severity`, `risk_level` not found) |
| `incidents.latitude/longitude` | ❌ **Do not exist** | None (`lat`, `lng`, `location_lat` not found) |

**Verdict:** No frontend column mapping is possible. All gaps require migration `20240008_frontend_tables.sql` to be applied.

## Observed Errors

### Missing `public.personnel` Table

**Source:** Map page — `src/routes/map.tsx:28:9`

```
[Client] Map load error: {
  code: 'PGRST205',
  details: null,
  hint: null,
  message: "Could not find the table 'public.personnel' in the schema cache"
}
```

**Root cause confirmed:** Migration `20240008_frontend_tables.sql` not applied. No equivalent table exists.

**Fix:**
- **Backend-only:** Apply migration `20240008_frontend_tables.sql` to create the `personnel` table
- **Frontend (already done):** `getPersonnel()` throws gracefully — Map shows "Personnel data unavailable" degraded state

---

### Missing `public.system_logs` Table

**Source:** Dashboard page — `src/routes/dashboard.tsx:55:9`

```
[Client] Dashboard load error: {
  code: 'PGRST205',
  details: null,
  hint: null,
  message: "Could not find the table 'public.system_logs' in the schema cache"
}
```

**Root cause confirmed:** Migration `20240008_frontend_tables.sql` not applied. No equivalent table exists.

**Fix:**
- **Backend-only:** Apply migration `20240008_frontend_tables.sql` to create the `system_logs` table
- **Frontend (already done):** `getSystemLogs()` throws gracefully — Dashboard/Command Center show degraded states
- **Frontend (already done):** `getDashboardStats()` non-blocking — missing tables don't block incident stats

---

### Command Center Incident Load Failure

**Root cause confirmed:** The incident detail route now handles missing IDs and UUID validation. The remaining gap is the unapplied schema — incident detail renders fine via `.select("*")`, but SMS/logs tabs are degraded because those tables don't exist.

**Fixes applied in Phase 1:**
- Sidebar no longer navigates to `/command-center/demo`
- `getIncidentById()` validates UUID format before querying
- `getSmsReportsByIncident()` and `getSystemLogsByIncident()` are non-blocking
- Error states distinguish `NOT_FOUND` / `SCHEMA_MISMATCH` / `NETWORK_ERROR`

**Remaining fix:** Apply migration `20240008_frontend_tables.sql` to create `sms_reports` and `system_logs` tables.

---

### Missing or Mismatched `incidents.latitude`

**Root cause confirmed:** Migration `20240008_frontend_tables.sql` not applied. No coordinate-like columns exist on `incidents` under any name.

**Fixes applied in Phase 1:**
- `getMapIncidents()` falls back to `getIncidents()` when coordinate columns are missing
- Map shows empty markers with a notice

**Remaining fix:** Apply migration `20240008_frontend_tables.sql` to add `latitude` and `longitude` columns.

---

### Missing or Mismatched `incidents.urgency`

**Root cause confirmed:** Migration `20240008_frontend_tables.sql` not applied. No priority/severity/risk_level equivalent exists on `incidents`.

**Fixes applied in Phase 1:**
- All incident queries use `.select("*")` with `?? "low"` fallback for missing `urgency`
- `getDashboardStats()` uses `.select("*")` instead of explicit column select
- Filtering by urgency (`.eq("urgency", ...)`) would fail at runtime but is behind user interaction

**Remaining fix:** Apply migration `20240008_frontend_tables.sql` to add `urgency` column.

---

### Header / Feed Time Shows `--:--`

**Observed UI in header or live alert feed:**

```
--:--
```

**Impact:**
- Time display in the header or alert feed is non-functional
- User cannot see when the last alert or update occurred

**Root cause:** Likely a frontend rendering issue — the time display component may not receive a valid `Date` or `created_at` value, or may not fall back to `Date.now()` when no backend timestamp is available.

**Recommended fix options (frontend-only):**

| Category | Fix |
|---|---|
| Frontend | Check the component responsible for the header/live-alert timestamp and ensure it has a valid time source |
| Frontend | If no backend timestamp is available, display the current local time as a fallback |
| Frontend | If the feed has no events, show "No recent alerts" instead of raw `--:--` |
| Test | Add a small E2E assertion to ensure the time fallback is human-readable, not raw `--:--` |

---

### Data-Dependent E2E Tests Skipped

**Skipped tests (12 total):**

| Count | Reason |
|---|---|
| 6 | Auth tests skipped — no `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` |
| 1 | Dashboard sections test skipped — required Supabase data unavailable |
| 1 | Incident row navigation test skipped — no incident row available |
| 2 | Command center sub-tests skipped — no valid incident data available |
| 1 | Reports stats test skipped — no report/stat data available |
| 1 | Settings profile test skipped — real profile/auth data unavailable |

**Impact:**
- The E2E suite proves the app shell and pages do not crash in mock-auth mode
- It does **not** prove:
  - Full data-backed workflows
  - Real auth flows (login, logout, session persistence)
  - Command center incident detail workflows
  - Seeded reports and charts
  - RLS policy behavior

**Recommended fix options:**

| Category | Fix |
|---|---|
| Seed data | Add deterministic test data for `incidents`, `sms_reports`, `personnel`, `system_logs` |
| Real auth | Create a dedicated test Supabase user; set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` |
| Test hardening | Keep tests defensive, but add stronger assertions when seed data exists |

---

## Fixes That Do Not Require Backend Schema Changes

These fixes can be implemented safely without modifying Supabase tables or running migrations.

### 1. Make Optional Data Queries Non-Blocking

**Problem:** A single failing query (e.g., `getSystemLogs()`, `getPersonnel()`, `getMapIncidents()`) can block the entire page from rendering.

**Fix:** Separate critical queries (required for the page to be meaningful) from optional queries (enhancements). Let optional queries fail gracefully:

- `getSystemLogs()` failure → show "System logs unavailable" — dashboard should still render stats
- `getPersonnel()` failure → show "Personnel data unavailable" — map should still render
- `getSystemLogsByIncident()` failure → show "Logs unavailable" — command center should still show incident detail

### 2. Add Graceful Degraded UI States

**Problem:** When data is unavailable, the UI shows a generic error or a blank area.

**Fix:** Add specific degraded-state messages:

- "System logs currently unavailable"
- "Personnel data could not be loaded"
- "Map data unavailable — check backend status"
- "No recent alerts"

These are more helpful than generic error text or empty sections.

### 3. Fix `--:--` Time Fallback

**Problem:** The header or feed area shows raw `--:--` when no timestamp is available.

**Fix (frontend-only):**
- If no backend timestamp exists, display current local time as fallback
- If the feed has no events, show "No recent alerts" instead of `--:--`

### 4. Prevent Invalid Command Center Route Usage

**Problem:** The sidebar Command Center link navigates to a hardcoded or invalid incident ID (`/command-center/demo`), which cannot load because no such incident exists.

**Fix:**
- Disable or hide the Command Center navigation link unless a real incident is selected
- Or prevent the sidebar from navigating to `/command-center/$incidentId` without an incident context
- Show a clearer "Select an incident first" state when there is no incident

### 5. Improve Command Center Error States

**Problem:** The current error state is generic — `"Failed to load incident"` — which does not distinguish between "not found", "missing data", "permission denied", or "backend unavailable".

**Fix:** Add specific error messages in the existing `IncidentError` / `IncidentNotFound` components:

- "Incident not found — the requested incident does not exist"
- "Unable to load incident data — some required data sources are unavailable"
- "Access denied — your session may not have permission to view this incident"

### 6. Add Frontend Field Mapping for Existing Backend Columns

**Status: INVESTIGATED — No mapping possible.**

**Problem:** The frontend expects `latitude`, `longitude`, and `urgency` columns, but the backend may use different names.

**Investigation result (2026-06-23):** The remote schema was inspected via REST API. The `incidents` table has exactly 7 columns from migration `20240005_incidents.sql`. No `lat`/`lng`/`location_lat`/`priority`/`severity`/`risk_level` columns exist. No equivalent tables exist for `personnel`, `system_logs`, or `sms_reports`.

**Conclusion:** All schema gaps originate from unapplied migration `20240008_frontend_tables.sql`. Frontend-only mapping is not possible.

### 7. Keep Mock Auth Mode for Page Testing

**Decision:** Mock auth mode should remain the default for page-rendering and navigation tests. Real auth should only be required for auth-specific test files.

### 8. Keep Real Auth Tests Optionally Skipped

**Decision:** Real-auth E2E tests should remain skipped (`test.skip()`) when `E2E_USER_EMAIL` is not set. This allows CI to run without real credentials while still allowing local developers to test auth when they configure their `.env`.

---

## Fixes That May Require Backend Schema Changes

These fixes require collaboration with the backend/infrastructure team or running Supabase migrations.

| Issue | Required Change | Priority |
|---|---|---|
| Missing `public.personnel` table | Create table with columns: `id`, `name`, `status`, `team_name`, `created_at` | High |
| Missing `public.system_logs` table | Create table with columns: `id`, `message`, `incident_id`, `created_at` | High |
| Missing `incidents.latitude` and `incidents.longitude` | Add columns to `incidents`, or add `lat`/`lng` if those names are preferred | Medium |
| Missing or mismatched `incidents.urgency` | Add `urgency` column with enum or CHECK constraint (`critical`, `high`, `medium`, `low`) | Medium |
| RLS policies blocking mock auth reads | Relax RLS for `anon` key read access on non-sensitive columns, or create a permissive test-only policy | Low (until real auth is needed) |

---

## Fixes That Require Seed / Test Data

Once schema is aligned, add deterministic seed data:

| Table | Minimum Rows | Fields to Populate |
|---|---|---|
| `incidents` | 3–5 | `id` (deterministic UUID), `title`, `status`, `urgency`, `location_name`, `latitude`, `longitude`, `created_at` |
| `sms_reports` | 3–5 | `id`, `incident_id` (FK), `sender_number`, `content`, `status`, `created_at` |
| `personnel` | 2–3 | `id`, `name`, `status`, `team_name`, `created_at` |
| `system_logs` | 3–5 | `id`, `message`, `incident_id` (FK), `created_at` |

The seed data should be:
- **Deterministic** — same IDs every time, so E2E tests can assert against known values
- **Idempotent** — safe to run multiple times (`INSERT ... ON CONFLICT DO NOTHING` or `TRUNCATE` + `INSERT`)
- **Testable** — rows should exercise all urgency levels, statuses, and team assignments

---

## Recommended Fix Order

### Phase 1: Frontend-Only Hardening (No Schema Changes)

| # | Task | Scope | Status |
|---|---|---|---|
| 1 | Make `getSystemLogs()` and `getPersonnel()` queries non-blocking | Frontend | ✅ Done |
| 2 | Add degraded UI states for missing optional data | Frontend | ✅ Done |
| 3 | Fix `--:--` time fallback | Frontend | ✅ Done |
| 4 | Prevent invalid Command Center sidebar navigation | Frontend | ✅ Done |
| 5 | Improve command center error states (not found vs. error vs. permission) | Frontend | ✅ Done |
| 6 | Check whether `incidents` schema has equivalent columns under different names | Investigation | ✅ Done — no equivalents found |
| 7 | If different column names exist, remap frontend queries | Frontend | ✅ Skipped — no equivalents exist, no mapping possible |

**Why first:** These fixes improve the user experience immediately, do not require backend coordination, and make subsequent E2E validation more robust.

### Phase 2: Schema Alignment

| # | Task | Scope | Status |
|---|---|---|---|
| 1 | Apply migration `20240008_frontend_tables.sql` to remote Supabase | Migration | [ ] Pending — creates ALL missing tables and columns |
| 2 | Confirm `personnel`, `system_logs`, `sms_reports`, `profiles` tables exist | Verification | [ ] Pending |
| 3 | Confirm `urgency`, `latitude`, `longitude`, `location_name` columns on `incidents` | Verification | [ ] Pending |
| 4 | Review and add RLS policies if mock-auth reads are blocked | Migration / Backend | [ ] Pending |
| 5 | Run E2E suite — expect data-dependent skipped tests to unblock | Verification | [ ] Pending |

**Why second:** Backend schema changes unblock data-dependent frontend features and E2E tests. All missing schema originates from a single unapplied migration (`20240008_frontend_tables.sql`), so applying it is the complete fix.

### Phase 3: Seed Test Data

| # | Task | Scope |
|---|---|---|
| 1 | Create deterministic seed SQL for `incidents`, `sms_reports`, `personnel`, `system_logs` | Seed data |
| 2 | Add seed execution to local dev setup and CI | DevOps |
| 3 | Verify E2E tests that were previously skipped now run | E2E |

**Why third:** Seed data allows full E2E validation of data-backed workflows.

### Phase 4: Real Auth Testing

| # | Task | Scope |
|---|---|---|
| 1 | Create dedicated E2E test user in Supabase Auth | Backend |
| 2 | Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` in CI secrets | DevOps |
| 3 | Verify real auth E2E tests pass (login, logout, session, RLS) | E2E |
| 4 | Verify RLS policies work correctly for authenticated and unauthenticated users | Backend / E2E |

**Why last:** Real auth testing depends on Phase 2 (schema) and Phase 3 (seed data) to be meaningful.

---

## Suggested Acceptance Criteria

| Criterion | Phase |
|---|---|
| All protected pages render in mock-auth mode without fatal errors | Phase 1 |
| Dashboard renders stats/incidents even if `system_logs` is missing | Phase 1 |
| Map renders incident markers or clear empty state even if `personnel` is missing | Phase 1 |
| Command Center shows specific error states (not found vs. unavailable vs. permission) | Phase 1 |
| Header time never shows raw `--:--` — either clock or "No recent alerts" | Phase 1 |
| `public.personnel` table exists and is queryable | Phase 2 |
| `public.system_logs` table exists and is queryable | Phase 2 |
| `incidents.latitude` and `incidents.longitude` are queryable (or mapped frontend-side) | Phase 2 |
| `incidents.urgency` is queryable (or mapped frontend-side) | Phase 2 |
| Seed data exists and produces deterministic results | Phase 3 |
| All 41 E2E tests run (0 skipped, 0 failed) in mock-auth mode with seed data | Phase 3 |
| Real auth tests pass with real Supabase Auth credentials | Phase 4 |
| No production credentials are committed to the repository | All |

---

## Notes for Future Real Auth Testing

1. **Do not use production credentials for E2E tests.** Create a dedicated Supabase Auth user in the project dashboard or via the Supabase Management API. Use a test-only email address.

2. **Store credentials securely:**
   - Local development: `.env` file (already gitignored)
   - CI: repository secrets or environment variables (named `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`)

3. **RLS consideration:** If RLS policies require `auth.uid()`, mock auth (which uses a fake user UUID without a real session) cannot satisfy them. Real auth tests will exercise the real RLS path. The two options are:
   - Keep mock auth for page-rendering tests and real auth for auth-specific tests
   - Or create a fully permissive RLS policy for the `anon` role during development (not recommended for production)

4. **Session handling:** Real auth tests use Playwright's `storageState` to persist the authenticated session across tests. The `auth-setup` project in `playwright.config.ts` handles this when `E2E_USER_EMAIL` is present.

5. **Sign-out test:** The real auth sign-out test validates that clearing the Supabase session properly redirects to `/login`. This test requires a real auth session to be meaningful.

6. **Future enhancement:** Consider adding admin API-based session token injection for faster auth setup in E2E tests, avoiding the UI login step entirely.
