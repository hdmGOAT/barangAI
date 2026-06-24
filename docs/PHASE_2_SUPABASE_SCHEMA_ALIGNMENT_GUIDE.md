# Phase 2 Supabase Schema Alignment Guide

## Current Project State

- **Project:** LihokBarangAI / BarangAI — React + Vite + TanStack Router connected to Supabase
- **Phase 1 (frontend hardening):** Complete — optional data queries are non-blocking, degraded UI states display gracefully, Command Center navigation is safe, `--:--` fallback is fixed, and Error states distinguish `NOT_FOUND` / `SCHEMA_MISMATCH` / `PERMISSION_DENIED` / `NETWORK_ERROR`
- **Phase 1 frontend mapping:** Complete — all schema gaps investigated; root cause identified
- **Mock auth mode:** Working — `VITE_ENABLE_MOCK_AUTH=true` lets all protected pages render without a real Supabase Auth session
- **E2E status:**
  ```
  29 passed
  12 skipped
    0 failed
  ```
  All 29 active tests pass. The 12 skipped are expected (6 real-auth tests, 6 data-dependent tests blocked by incomplete schema/seed data).

## Actual Remote Schema (Inspected 2026-06-23)

### Tables That Exist

#### `incidents` (7 columns from migration 20240005)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `title` | text | |
| `concern_type` | text | |
| `location_zone` | text | |
| `status` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Missing columns (defined in unapplied migration 20240008):** `urgency`, `location_name`, `latitude`, `longitude`, `assigned_personnel_id`, `barangay_id`

#### `reports` (29 columns from migration 2024002-20240004)
Key columns: `id`, `ticket_number`, `raw_message_id`, `citizen_ref`, `channel`, `concern_type`, `location_raw`, `location_zone`, `location_landmark`, **`urgency_level`**, `summary`, `affected_persons`, `original_language`, `suggested_office`, `suggested_action`, `llm_confidence`, `auto_reply_text`, `auto_reply_sent`, `staff_reply_text`, `staff_reply_sent`, `status`, `assigned_office`, `created_at`, `updated_at`, `resolved_at`, `is_realistic`, `unrealistic_reason`, `incident_id`, `summary_embedding`

#### `raw_messages` (from migration 20240001)
#### `pending_clarifications` (from migration 20240003)

### Tables That Do NOT Exist

| Table | Defined In | Status |
|-------|-----------|--------|
| `sms_reports` | migration 20240008 | **Not applied** — no equivalent table exists |
| `personnel` | migration 20240008 | **Not applied** — no equivalent table exists |
| `system_logs` | migration 20240008 | **Not applied** — no equivalent table exists |
| `profiles` | migration 20240008 | **Not applied** — no equivalent table exists |

### Migrations Applied vs. Missing

| Migration | Applied? | Content |
|-----------|---------|---------|
| `20240001_raw_messages.sql` | ✅ Yes | `raw_messages` table |
| `20240002_reports.sql` | ✅ Yes | `reports` table (initial) |
| `20240003_clarifications.sql` | ✅ Yes | `pending_clarifications`, `report_clarifications` |
| `20240004_reports_location_office.sql` | ✅ Yes | Added `location_landmark`, `suggested_office`, `suggested_action` |
| `20240005_incidents.sql` | ✅ Yes | `incidents` table (7 columns only) |
| `20240006_clustering_fixes.sql` | ✅ Yes | `match_similar_reports` function fix |
| `20240007_update_vector_dim.sql` | ✅ Yes | vector dim 768→3072, updated function |
| `20240008_frontend_tables.sql` | **❌ No** | `profiles`, `sms_reports`, `personnel`, `system_logs` + `incidents` columns (`urgency`, `location_name`, `latitude`, `longitude`, etc.) |

### Key Findings

1. **Migration `20240008_frontend_tables.sql` was never applied.** This single migration contains ALL missing tables and columns the frontend needs.
2. **No equivalent tables exist.** Searched for `responders`, `teams`, `patrols`, `response_units`, `activity_logs`, `audit_logs`, `events`, `incident_logs` — none exist.
3. **No equivalent column names.** Checked for `priority`, `severity`, `risk_level`, `lat`, `lng`, `location_lat`, `location_lng` on `incidents` — none exist.
4. **`reports.urgency_level`** exists with values `critical|high|medium|low` but is on the `reports` table, not `incidents`. Structurally too different to map frontend-side.
5. **`reports.location_zone`** and `reports.location_raw` exist but provide text-based location, not coordinates.
6. **ALL schema gaps have a single root cause:** unapplied migration `20240008_frontend_tables.sql`. No naming mismatch or equivalent-table scenario.

## Why Phase 2 Is Needed

Phase 1 made the app **survive** broken backend dependencies. Pages render, the navigation works, and error states are human-readable. Schema inspection confirmed that **no equivalent tables or columns exist under different names** — the gaps are genuine missing schema, not naming mismatches.

Without Phase 2:

- The map cannot show real incident markers (no coordinates on `incidents`)
- The dashboard cannot show urgency-based stats (`incidents` has no `urgency` column)
- `getDashboardStats()` returns zeroes for SMS/personnel (tables don't exist)
- The command center cannot load SMS or logs (tables don't exist)
- Personnel dispatch is entirely blocked (no `personnel` table)
- Realtime subscriptions for `system_logs` and `personnel` do nothing
- Every data-backed E2E test stays skipped

Phase 2 aligns the database schema with what the frontend and backend edge functions expect, making the app actually operable. The fix is clear: **apply migration `20240008_frontend_tables.sql` to add all missing tables and columns at once.**

## Important Warning: Do Not Blindly Create Tables or Columns

The fastest mistake in Phase 2 is reading the error messages and immediately writing migrations to create `personnel`, add `latitude`, etc. This is wrong because:

1. **The table may already exist under a different name.** What if `responders` already has the same shape as `personnel`? Creating `personnel` duplicates it.
2. **The column may already exist under a different name.** What if the database uses `priority` instead of `urgency`, or `lat`/`lng` instead of `latitude`/`longitude`? Adding columns duplicates data.
3. **Edge functions may already depend on a different naming convention.** Creating parallel tables/columns creates schema drift.
4. **Not all error messages mean the column is missing.** An RLS policy or a restricted API key can produce error messages that look like schema errors.
5. **Destructive migrations are hard to undo.** Dropping or renaming a column that an edge function unexpectedly depends on causes production downtime.

**The entire goal of Phase 2 is to inspect the actual Supabase schema first, compare it with the frontend expectations, then decide — for each issue — whether to remap the frontend or migrate the database.**

## What Needs to Be Investigated First

Before writing any migration, answer these questions:

1. **Which Supabase project is this connected to?** Check `VITE_SUPABASE_URL` in `.env` or the project dashboard.
2. **What tables already exist?** Run `supabase db pull` or inspect the Supabase dashboard Table Editor.
3. **What migrations are already applied?** Check `supabase/migrations/` for existing migration files.
4. **Do edge functions exist, and what tables/columns do they use?** Check `supabase/functions/` for any SQL or RPC calls.
5. **Is there an existing seed file?** Check `supabase/seed.sql` for current test data.
6. **Are there any Supabase type definitions?** Check `database.types.ts` or similar auto-generated type files.
7. **What RLS policies exist?** Check the Supabase dashboard SQL Editor or `supabase/config.toml`.

## Frontend Expectations

The frontend expects the following from its queries (defined in `src/lib/queries.ts` and `src/lib/types.ts`):

| Table | Expected Columns | Frontend Type |
|---|---|---|
| `incidents` | `id`, `title`, `status`, `urgency`, `location_name`, `location_zone`, `latitude`, `longitude`, `created_at`, `assigned_personnel_id`, `barangay_id`, `updated_at`, `concern_type` | `Incident` |
| `sms_reports` | `id`, `sender_number`, `content`, `status`, `incident_id`, `barangay_id`, `created_at` | `SmsReport` |
| `personnel` | `id`, `team_name`, `current_location`, `latitude`, `longitude`, `status`, `barangay_id`, `created_at`, `updated_at` | `Personnel` |
| `system_logs` | `id`, `message`, `incident_id`, `barangay_id`, `created_at` | `SystemLog` |

The route-level queries are:

| Source | Query | Tables Read |
|---|---|---|
| Dashboard | `getDashboardStats()` | `incidents`, `sms_reports`, `personnel` |
| Dashboard | `getRecentIncidents(5)` | `incidents` |
| Dashboard | `getSystemLogs(5)` | `system_logs` |
| Dashboard | `getCategories()` | `incidents` (column: `concern_type`) |
| Dashboard | `getResponseTrend()` | `incidents` (column: `created_at`, `urgency`) |
| Map | `getMapIncidents()` | `incidents` (columns: `id`, `title`, `latitude`, `longitude`, `urgency`) |
| Map | `getPersonnel()` | `personnel` |
| Incidents | `getIncidents(filters?)` | `incidents` |
| Command Center | `getIncidentById(id)` | `incidents` |
| Command Center | `getSmsReportsByIncident(id)` | `sms_reports` |
| Command Center | `getSystemLogsByIncident(id)` | `system_logs` |
| Reports | `getSmsReports(50)` | `sms_reports` |

## Schema Investigation Completed — Confirmed Findings

The remote Supabase schema was inspected via direct REST API queries (`/rest/v1/` table listing + `?select=` column tests on all known tables). The decision matrix results are definitive:

| Gap | Frontend Expects | Actual Schema | Verdict |
|---|---|---|---|
| personnel | `personnel` table | **Does not exist.** No `responders`, `teams`, `patrols`, `response_units` equivalent | **Migration required** |
| system_logs | `system_logs` table | **Does not exist.** No `activity_logs`, `audit_logs`, `events`, `incident_logs` equivalent | **Migration required** |
| sms_reports | `sms_reports` table | **Does not exist.** No equivalent table | **Migration required** |
| coordinates | `latitude`, `longitude` on incidents | **Do not exist.** No `lat`, `lng`, `location_lat`, PostGIS geom | **Migration required** |
| urgency | `urgency` column on incidents | **Does not exist.** No `priority`, `severity`, `risk_level` | **Migration required** |
| profiles | `profiles` table | **Does not exist.** Auth is not set up | **Migration required** |

### Root Cause

Migration `20240008_frontend_tables.sql` defines ALL missing tables and columns but was **never applied** to the remote Supabase project. This is a deployment gap, not a naming mismatch.

### Frontend-Only Fixes Already Applied

- `getDashboardStats()`: Made `sms_reports` and `personnel` queries non-blocking so incident stats render even when those tables are absent
- `getIncidents()` / `getRecentIncidents()`: Uses `.select("*")` and `?? "low"` fallback for missing `urgency`
- `getIncidentById()`: Uses `.select("*")` — no explicit column dependency
- `getMapIncidents()`: Falls back to `getIncidents()` when coordinate columns are missing
- `getSmsReportsByIncident()` / `getSystemLogsByIncident()`: Non-blocking in command center
- All missing tables show degraded UI states: "Personnel data unavailable", "Logs unavailable", etc.

### What Remains for Backend

**Apply migration `20240008_frontend_tables.sql`.** This single migration creates all missing tables and adds all missing columns. It is idempotent (uses `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).

After applying, re-run the E2E suite — 6 data-dependent tests should unblock and become passable once seed data exists (Phase 3).

---

### 5. Command Center Incident Detail Failure

**Observed behavior:** Navigating to `/command-center/$incidentId` shows either "Incident not found" or "Failed to load incident".

**Possible causes (in order of likelihood):**
1. The incident ID in the URL does not exist in the database — the route was opened with a hardcoded `demo` ID or a stale ID
2. The `getIncidentById()` query fails because it selects a column that does not exist (e.g., `urgency`)
3. The `Promise.all` cascade: `getSystemLogsByIncident()` throws, and the original code treated all three queries as a single critical path (this is fixed in Phase 1)
4. The call to `.single()` returns `PGRST116` (no rows) for existing IDs because RLS policies block the anonymous/mock user
5. The call to `supabase.from("incidents").select("*")` fails because the table itself has issues

**What to check first:**
- Navigate to `/command-center/<a-real-uuid>` (copy an ID from the Supabase Table Editor). Does it load?
- Run the `getIncidentById()` query directly in the Supabase SQL Editor. Does it return a row?
- Check RLS policies. Is the anon key allowed to SELECT from `incidents`?
- Check if the incident ID is a valid UUID format.

**Possible without migration:**
- If the issue is only that the sidebar points to a fake ID (already fixed in Phase 1), no schema work is needed
- If the issue is RLS, create a permissive policy for the anon key on read-only non-sensitive columns, or proceed to Phase 4 (real auth)
- If the issue is missing columns, address them under items 3 and 4 above

**Migration justified when:**
- The `incidents` table truly lacks required columns (urgency, coordinates, etc.)
- RLS policies are too restrictive and need adjustment

## How to Inspect the Existing Supabase Schema

### Option A: Supabase Dashboard (no CLI needed)

1. Log into the Supabase project dashboard
2. Go to **SQL Editor** → run:
   ```sql
   select table_name, column_name, data_type, is_nullable
   from information_schema.columns
   where table_schema = 'public'
   order by table_name, ordinal_position;
   ```
3. Go to **Table Editor** to visually inspect each table's columns and a sample row
4. Go to **Database** → **Policies** to review RLS rules

### Option B: Supabase CLI (recommended for repeatable inspection)

```bash
# Pull the remote schema into local migration files
supabase db pull
# This creates a migration file in supabase/migrations/ with the current schema

# View the resulting migration file
cat supabase/migrations/<timestamp>_remote_commit.sql

# List all local migrations
supabase migration list

# Connect to the local database and inspect
supabase db diff
```

### Option C: Direct SQL queries (ad-hoc)

Run these in the Supabase SQL Editor to check specific questions:

```sql
-- List all public tables
select table_name from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE';

-- Check incidents columns
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'incidents'
order by ordinal_position;

-- Check for coordinate-like columns across all tables
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and column_name in ('latitude', 'longitude', 'lat', 'lng', 'location_lat', 'location_lng');

-- Check for urgency/priority-like columns
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and column_name in ('urgency', 'priority', 'severity', 'risk_level');

-- Check for responder/personnel-like tables
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('personnel', 'responders', 'teams', 'patrols', 'response_units');

-- Check for log-like tables
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('system_logs', 'activity_logs', 'audit_logs', 'events', 'incident_logs');
```

## How to Decide Between Frontend Mapping vs. Database Migration

For each schema gap, apply this decision tree:

```
1. Does an equivalent table/column already exist under a different name?
   ├── YES → Can the frontend query use the existing name? 
   │   ├── YES → Use frontend mapping. No migration needed.
   │   └── NO → Is the difference structural enough to need a migration?
   │       ├── YES → Create migration with ADD COLUMN IF NOT EXISTS, keeping original
   │       └── NO → Remap the column in the frontend query
   └── NO → Does the feature require this data to be stored?
       ├── YES → Migration justified
       └── NO → Keep Phase 1 degraded state
```

**Prefer frontend mapping when:**

- The equivalent data exists but is named differently
- The mapping logic is straightforward (`priority` → `urgency`)
- No edge functions depend on the frontend's expected naming convention
- The realtime subscription name can be updated easily

**Prefer database migration when:**

- The table/column genuinely does not exist
- Multiple frontend components or edge functions need the same column name
- The realtime subscription requires a specific table name
- The existing naming convention is confusing or inconsistent

## Issues That Might Not Need Backend Schema Changes

The following issues found during E2E testing may be fixable entirely on the frontend side. Investigate these before writing any migration:

### Column name mismatches

| Frontend Expects | Check for Existing Column |
|---|---|
| `latitude` | `lat`, `location_lat` |
| `longitude` | `lng`, `location_lng` |
| `urgency` | `priority`, `severity`, `risk_level` |
| `team_name` (personnel) | `name`, `unit_name`, `team` |
| `current_location` (personnel) | `location`, `assigned_area` |

### Table name mismatches

| Frontend Expects | Check for Existing Table |
|---|---|
| `personnel` | `responders`, `teams`, `patrols`, `response_units`, `deployment_teams` |
| `system_logs` | `activity_logs`, `audit_logs`, `events`, `incident_logs`, `notification_logs` |

### Navigation and ID issues

- The "Command Center incident detail failure" may be caused by an invalid hardcoded route ID, not a schema problem
- The Phase 1 fix (changing sidebar link from `/command-center/demo` to `/command-center`) already prevents this
- To fully fix: ensure the Command Center is only navigated to from a real incident row (clicking an incident card)

### RLS restricting mock auth reads

- RLS policies that require `auth.uid()` will block the mock auth user (who has no real Supabase session)
- This is expected and correct security behavior
- Fix: use real auth (Phase 4) or temporarily create a permissive policy if non-sensitive data needs testability

## Issues That Likely Need Backend Schema Changes

A migration is justified only when:

### 1. No equivalent personnel/responder table exists

If no table stores team member data with status and location:
- The personnel dispatch feature cannot work
- The dashboard personnel stats will always show zero
- A `personnel` table needs to be created

### 2. No equivalent log/activity table exists

If no table stores operational or system events:
- The System Log feed on the dashboard and command center will always be degraded
- The realtime subscription has no target
- A `system_logs` table needs to be created

### 3. Incidents truly have no coordinate columns

If no variant of latitude/longitude exists in the `incidents` table:
- Map markers cannot render
- The `getMapIncidents()` query cannot function
- Coordinate columns need to be added

### 4. Incidents truly have no priority/urgency/severity field

If no field represents the incident priority level:
- Urgency-based filters on the Incidents page do not work
- Dashboard "critical incidents" stat is always zero
- An urgency column needs to be added

### 5. Edge functions need a stable target

If existing Supabase Edge Functions write to tables that the frontend cannot read because of naming mismatches:
- The Edge Function might need updating, or a migration might be needed
- Coordinate between frontend and backend naming before choosing

### 6. Realtime subscriptions need stable table names

If realtime is enabled on the project but the frontend subscribes to a table name that does not exist:
- The table must either be created or the frontend subscription updated to the existing table name
- Note: Supabase realtime requires the table to exist — you cannot subscribe to a non-existent table

## Recommended Schema Alignment Process

Follow this process for EACH schema gap. Do not batch all gaps into a single "fix everything" session without reviewing each one individually.

### Step 1: Inspect

- Run the information_schema queries from the "How to Inspect" section above
- Check for equivalent tables/columns under different names
- Check existing migrations and seed data
- Check edge function source code for table references

**Example (do not apply — illustrative only):**
```bash
supabase db pull
supabase migration list
```

### Step 2: Compare

- Read `src/lib/queries.ts` and note every table and column the frontend queries
- Read `src/lib/types.ts` and note the expected shape of each table
- Create a diff: "Frontend expects X, database has Y"

### Step 3: Decide (mapping vs. migration)

For each diff:
- Can the frontend query be updated to use the existing column/table name?
- If yes → create a frontend-only change (do in Phase 1 or a maintenance PR)
- If no → proceed to Step 4

### Step 4: Write migration (only if truly needed)

If a migration is genuinely needed:

```sql
-- ⚠️ EXAMPLE ONLY — do not apply without confirming the existing schema
alter table public.incidents
add column if not exists urgency text check (urgency in ('critical', 'high', 'medium', 'low'));

alter table public.incidents
add column if not exists latitude double precision,
add column if not exists longitude double precision;

create table if not exists public.personnel (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  current_location text,
  latitude double precision,
  longitude double precision,
  status text not null default 'offline',
  barangay_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  incident_id uuid references public.incidents(id) on delete cascade,
  barangay_id uuid,
  created_at timestamptz not null default now()
);
```

**Critical rules for migrations:**

1. Always use `if not exists` / `add column if not exists` — migrations must be **idempotent**
2. Never `drop` or `rename` existing columns — you don't know what edge functions depend on them
3. Never use `not null` on new columns without a default — existing rows would fail the migration
4. Verify migration locally (`supabase db reset`) before deploying
5. Run `supabase migration new <name>` instead of manually creating migration files

### Step 5: Review RLS

After adding tables or columns:
- Enable RLS on new tables if not already enabled
- Create policies for the anon key (read-only) if mock-auth testing is needed
- Create policies for authenticated users matching expected roles
- Test with the mock auth profile UUID if RLS checks `auth.uid()` against `barangay_id`

### Step 6: Verify

```bash
# Run typecheck, lint, build
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build

# Run E2E tests
pnpm --filter web test:e2e
```

**Note:** Some skipped tests will remain skipped until Phase 3 (seed data) provides deterministic rows. E2E pass count should not decrease from the Phase 1 baseline of 29.

### Step 7: Document

Update `docs/SUPABASE_E2E_ISSUES.md` with:
- What was resolved
- What was mapped instead of migrated
- What remains for Phase 3 and Phase 4

## RLS and Auth Considerations

### Mock auth and RLS

Mock auth (`VITE_ENABLE_MOCK_AUTH=true`) does NOT create a real Supabase Auth session. The `supabase` client uses the anon key. This means:

- **RLS policies that check `auth.uid()` will block reads.** The mock user has a fake UUID but no real session token.
- **RLS policies that allow `true` (permissive) will work.** Tables created during Phase 2 should start with a permissive read policy for testing.

### Recommended RLS approach for Phase 2

```sql
-- ⚠️ EXAMPLE ONLY — do not apply blindly
-- Permissive read policy for testing (Phase 2)
create policy "anon can read incidents"
  on public.incidents for select
  to anon
  using (true);

-- Restricted write policy (later for Phase 4)
create policy "authenticated users can insert incidents"
  on public.incidents for insert
  to authenticated
  with check (auth.uid() is not null);
```

### What to keep in mind

- Do not weaken security for production. If a table contains sensitive data, keep RLS strict.
- If the anon key should not read production incident data, keep the permissive policy scoped to a test/sandbox schema or skip Phase 2 read testing and move directly to Phase 4 (real auth).
- The `personnel` and `system_logs` tables are operational — a permissive read policy for development is reasonable.

## What Not to Do in Phase 2

| Don't | Why |
|---|---|
| Blindly create tables based on error messages | The table may already exist under a different name |
| Drop or rename existing columns | Edge functions and other code may depend on them |
| Use `NOT NULL` on new columns without a default | Existing rows would fail the migration |
| Batch all schema fixes into one migration without per-issue review | Each gap may have a different optimal fix (mapping vs. migration) |
| Skip the inspection step | You cannot make informed decisions without knowing the actual schema |
| Create seed data in the same PR as schema changes | Seeds belong in Phase 3; keep phases separate for clean PRs |
| Add real auth credentials or test users | Real auth belongs in Phase 4 |
| Create an entirely new incidents table | The `incidents` table already exists — only add missing columns |
| Remove the Phase 1 degraded UI | Degraded states remain as safety nets even after schema alignment |

## Phase 2 Checklist Status

```
[x] 1. Inspect existing Supabase schema via dashboard or CLI
[x] 2. Check existing migrations in supabase/migrations/
[x] 3. Check edge function table references in supabase/functions/
[x] 4. Compare actual schema with frontend expectations (queries.ts + types.ts)
[x] 5. Identify equivalent tables/columns under different names — NONE FOUND
[x] 6. Decide mapping vs. migration for each gap — ALL require migration
[x] 7. Write schema plan document (this guide updated with findings)
[ ] 8. For each migration candidate:
    [x] a. Confirm no existing equivalent exists — DONE
    [ ] b. Create or apply idempotent migration (migration 20240008 already exists)
    [ ] c. Add permissive RLS policy for anon reads
    [ ] d. Run migration locally (supabase db reset)
[ ] 9. Update frontend queries — NONE needed beyond Phase 1 hardening
[ ] 10. Run typecheck, lint, build
[ ] 11. Run E2E suite (expect 29+ passed, fewer skipped)
[ ] 12. Update SUPABASE_E2E_ISSUES.md with resolved items
[ ] 13. Commit schema changes separately from frontend mapping changes
```

## Decision Matrix — Confirmed

| Gap | Frontend Expects | Actual | Decision | Notes |
|---|---|---|---|---|
| personnel | `personnel` table | **Does not exist** | Apply migration 20240008 | No responder/team/patrol equivalent exists |
| system_logs | `system_logs` table | **Does not exist** | Apply migration 20240008 | No activity/audit/event log equivalent exists |
| sms_reports | `sms_reports` table | **Does not exist** | Apply migration 20240008 | Table is defined in 20240008 |
| coordinates | `latitude`, `longitude` | **Do not exist** | Apply migration 20240008 | No coordinate variant or PostGIS column exists |
| urgency | `urgency` column on `incidents` | **Does not exist** | Apply migration 20240008 | No priority/severity/risk_level variant exists |
| profiles | `profiles` table | **Does not exist** | Apply migration 20240008 | Table is defined in 20240008 |
| Command Center | Incident detail + SMS + logs | Schema incomplete | Apply migration 20240008 | Phase 1 fixed navigation; schema gap remains |
| Dashboard stats | Incidents + SMS + personnel | Partial data | Phase 1 hardening + migration 20240008 | `getDashboardStats()` now non-blocking for missing tables |

## Acceptance Criteria for Phase 2

1. ✅ **Schema inspection is complete** — remote schema directly inspected via REST API
2. ✅ **No duplicate tables would be created** — confirmed no equivalent tables exist
3. ✅ **No destructive schema changes needed** — migration 20240008 uses `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
4. ✅ **Frontend mappings checked** — no equivalent columns exist; migration is the only path
5. ✅ **Missing tables/columns clearly identified** — all gaps originate from unapplied migration 20240008
6. [ ] **Every migration is idempotent** — migration 20240008 already uses `IF NOT EXISTS`
7. [ ] **RLS policy decisions are documented** — permissive read policies for development are intentional
8. ✅ **E2E still passes in mock-auth mode** — 29-pass baseline maintained (verified)
9. [ ] **Data-dependent skipped tests can be enabled after Phase 3** — schema changes do not block future seed data

## What Comes After Phase 2

| Phase | Scope |
|---|---|
| Phase 3 | Deterministic seed data for incidents, sms_reports, personnel, system_logs |
| Phase 3 | Enable data-dependent E2E tests that were previously skipped |
| Phase 3 | Verify full workflows (command center, reports, map markers) |
| Phase 4 | Create dedicated E2E Supabase Auth user |
| Phase 4 | Set `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` |
| Phase 4 | Run real-auth E2E tests and verify RLS policies |
| Phase 4 | Remove permissive anon policies if desired |

## Summary

The core message of Phase 2 is:

**Inspect and compare first. Map existing backend fields when possible. Only migrate what is truly missing.**
