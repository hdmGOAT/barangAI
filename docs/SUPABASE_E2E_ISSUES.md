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

**Impact:**
- Map page cannot load personnel data for the sidebar / personnel list
- Personnel dispatch controls may fail or show error state
- Incident markers may still render if `incidents` query succeeds (if `latitude`/`longitude` columns exist)

**Root cause:** The `public.personnel` table does not exist in the Supabase schema cache.

**Recommended fix options:**

| Category | Fix |
|---|---|
| Backend | Create `public.personnel` table with required columns (`id`, `name`, `status`, `team_name`, `created_at`) |
| Frontend | Make `getPersonnel()` query non-blocking — show "Personnel data unavailable" instead of blocking the entire map |
| Test | Allow map test to pass when incident map loads but personnel is missing (document as degraded mode) |

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

**Impact:**
- Dashboard `useEffect` may fail entirely, preventing stats/incidents from rendering
- Live alert / system log feed cannot show data
- Realtime subscription on `system_logs` cannot work
- Command Center logs section is also affected

**Root cause:** The `public.system_logs` table does not exist in the Supabase schema cache.

**Recommended fix options:**

| Category | Fix |
|---|---|
| Backend | Create `public.system_logs` table with required columns (`id`, `message`, `incident_id`, `created_at`) |
| Frontend | Make `getSystemLogs()` query non-blocking — dashboard stats/incidents should render even if logs are unavailable |
| Test | Dashboard test should accept missing logs as degraded mode only if main dashboard content still renders |

---

### Command Center Incident Load Failure

**Observed UI on `/command-center/$incidentId`:**

```
Error loading incident
Failed to load incident
```

**Impact:**
- Command Center page cannot render incident details
- Dispatch button, broadcast form, SMS feed, and system logs are blocked
- Data-dependent command center tests are skipped

**Possible causes:**
1. The route is navigated to without a real incident ID (e.g., `demo`)
2. The incident ID exists in the URL but not in Supabase
3. The `incidents` table exists but required columns are missing (`urgency`, `location_name`, etc.)
4. `getIncidentById()` expects fields not present in the actual schema
5. RLS policies reject reads because mock auth does not create a real Supabase auth session — `auth.uid()` may be null
6. `system_logs` query in `Promise.all` rejects, cascading the entire load

**Recommended fix options:**

| Category | Fix |
|---|---|
| Frontend | Prevent sidebar Command Center link from navigating to an invalid dynamic route without a real incident ID |
| Frontend | Improve command center error states: distinguish "not found", "data unavailable", "permission denied" instead of generic error |
| Frontend | Separate the `system_logs` query from the critical path (incident + SMS) so a missing logs table does not block the page |
| Backend | Add required columns to `incidents` table if missing (`urgency`, `location_name`, `latitude`, `longitude`) |
| Backend/RLS | Ensure anon or mock-auth mode can read non-sensitive test data, or create a dedicated E2E test auth user |
| Seed data | Add at least one deterministic test incident so the command center can load in CI |

---

### Missing or Mismatched `incidents.latitude`

**Source:** Map page — `src/routes/map.tsx:28:9`, `src/lib/queries.ts:126` (`getMapIncidents()`)

```
code: '42703'
message: 'column incidents.latitude does not exist'
```

**Impact:**
- `getMapIncidents()` query fails because it `SELECT`s a column that does not exist
- Map cannot render incident markers
- E2E map tests can only verify empty/error states, not actual markers

**Root cause:** The `incidents` table exists but has no `latitude` column. The frontend query references `latitude` (and `longitude`).

**Recommended fix options:**

| Category | Fix |
|---|---|
| Backend | Add `latitude` and `longitude` columns to `incidents` |
| Frontend | Check if existing schema uses different names (`lat`, `lng`, `location_lat`, `location_lng`, `coordinates`) and map the query accordingly |
| Frontend | If coordinates are optional, use `.not("latitude", "is", null)` guard only when column exists, or skip the query gracefully |

---

### Missing or Mismatched `incidents.urgency`

**Source:** Dashboard (`getDashboardStats()`), Incidents page, Reports page

```
[N/A — no explicit error logged, but queries return no data or incorrect data]
```

**Impact:**
- Incident cards/lists may not show priority correctly
- Dashboard critical/high/medium/low stats may be wrong or fail
- `urgency`-based filters may not work
- Reports may not group incidents correctly
- The `getCategories()` query (select `concern_type`) may still work, but urgency-aware features are broken

**Root cause:** The `incidents` table exists but has no `urgency` column (or the column has a different name/type).

**Recommended fix options:**

| Category | Fix |
|---|---|
| Backend | Add an `urgency` column (ideally with a `CHECK` constraint or enum: `critical`, `high`, `medium`, `low`) |
| Frontend | Check if existing schema uses `priority`, `severity`, or `risk_level` — map that field to frontend `urgency` type |
| Frontend | Default missing urgency to `medium` only as a temporary UI fallback, and document the assumption |

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

**Problem:** The frontend expects `latitude`, `longitude`, and `urgency` columns, but the backend may use different names.

**Fix (investigate and map):**
- Check if `incidents` uses `lat` / `lng` instead of `latitude` / `longitude`
- Check if `incidents` uses `priority`, `severity`, or `risk_level` instead of `urgency`
- If the columns exist under different names, update the frontend query column names — no migration needed
- If the columns truly do not exist, log the specific mismatch and plan a migration

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

| # | Task | Scope |
|---|---|---|
| 1 | Make `getSystemLogs()` and `getPersonnel()` queries non-blocking | Frontend |
| 2 | Add degraded UI states for missing optional data | Frontend |
| 3 | Fix `--:--` time fallback | Frontend |
| 4 | Prevent invalid Command Center sidebar navigation | Frontend |
| 5 | Improve command center error states (not found vs. error vs. permission) | Frontend |
| 6 | Check whether `incidents` schema has `lat`/`lng`/`priority`/`severity` columns under different names | Investigation |
| 7 | If different column names exist, remap frontend queries | Frontend |

**Why first:** These fixes improve the user experience immediately, do not require backend coordination, and make subsequent E2E validation more robust.

### Phase 2: Schema Alignment

| # | Task | Scope |
|---|---|---|
| 1 | Add `public.personnel` table | Migration |
| 2 | Add `public.system_logs` table | Migration |
| 3 | Add `latitude`/`longitude` to `incidents` (if missing) | Migration |
| 4 | Add `urgency` to `incidents` (if missing) | Migration |
| 5 | Review and adjust RLS policies if mock-auth reads are blocked | Migration / Backend |

**Why second:** Backend schema changes unblock data-dependent frontend features and E2E tests.

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
