-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: frontend_tables
-- Tables needed by the frontend console: profiles, sms_reports, personnel,
-- system_logs, plus extra columns on incidents for the map and detail views.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Extend incidents for the frontend console ────────────────────────────
alter table if exists incidents
  add column if not exists urgency text not null default 'low'
    check (urgency in ('critical', 'high', 'medium', 'low')),
  add column if not exists location_name text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists assigned_personnel_id uuid,
  add column if not exists barangay_id text;

create index if not exists idx_incidents_urgency on incidents (urgency);
create index if not exists idx_incidents_location on incidents (location_name);

-- ── 2. profiles ─────────────────────────────────────────────────────────────
-- One row per authenticated user, created by auth webhook or trigger.
create table if not exists profiles (
  id            uuid         primary key references auth.users(id) on delete cascade,
  full_name     text         not null default '',
  role          text         not null default 'user',
  avatar_url    text,
  barangay_id   text,
  created_at    timestamptz  not null default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create profile row on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 3. sms_reports ──────────────────────────────────────────────────────────
-- Incoming SMS messages from the SMS gateway, with processing status.
create table if not exists sms_reports (
  id             uuid         primary key default gen_random_uuid(),
  sender_number  text         not null,
  content        text         not null,
  status         text         not null default 'pending'
                    check (status in ('pending', 'processing', 'verified')),
  incident_id    uuid         references incidents(id) on delete set null,
  barangay_id    text,
  created_at     timestamptz  not null default now()
);

alter table sms_reports enable row level security;

create policy "Authenticated users can read sms_reports"
  on sms_reports for select
  using (auth.role() = 'authenticated');

create index if not exists idx_sms_reports_status on sms_reports (status);
create index if not exists idx_sms_reports_incident on sms_reports (incident_id);
create index if not exists idx_sms_reports_created on sms_reports (created_at desc);

-- ── 4. personnel ────────────────────────────────────────────────────────────
-- Response teams and their current deployment status.
create table if not exists personnel (
  id               uuid         primary key default gen_random_uuid(),
  team_name        text         not null,
  current_location text,
  latitude         double precision,
  longitude        double precision,
  status           text         not null default 'standby'
                     check (status in ('online', 'busy', 'offline', 'standby')),
  barangay_id      text,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now()
);

alter table personnel enable row level security;

create policy "Authenticated users can read personnel"
  on personnel for select
  using (auth.role() = 'authenticated');

create index if not exists idx_personnel_status on personnel (status);

-- Auto-update updated_at
create trigger personnel_updated_at
  before update on personnel
  for each row execute function update_updated_at();

-- ── 5. system_logs ──────────────────────────────────────────────────────────
-- Audit trail for incident actions and system events.
create table if not exists system_logs (
  id           uuid         primary key default gen_random_uuid(),
  message      text         not null,
  incident_id  uuid         references incidents(id) on delete set null,
  barangay_id  text,
  created_at   timestamptz  not null default now()
);

alter table system_logs enable row level security;

create policy "Authenticated users can read system_logs"
  on system_logs for select
  using (auth.role() = 'authenticated');

create index if not exists idx_system_logs_incident on system_logs (incident_id);
create index if not exists idx_system_logs_created on system_logs (created_at desc);

-- ── 6. Enable realtime for relevant tables ──────────────────────────────────
-- Must be called separately; Supabase realtime is enabled via publication.
-- This is a no-op if the publication already includes these tables.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename in ('incidents', 'sms_reports', 'system_logs', 'personnel')
  ) then
    -- note: alter publication is additive; duplicate tables are ignored
    alter publication supabase_realtime add table public.incidents;
    alter publication supabase_realtime add table public.sms_reports;
    alter publication supabase_realtime add table public.system_logs;
    alter publication supabase_realtime add table public.personnel;
  end if;
end;
$$;
