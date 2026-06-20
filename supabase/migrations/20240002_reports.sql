-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: reports
-- Core domain table. One row per citizen concern, populated by the LLM parser.
-- All LLM-extracted fields are nullable — a report can exist even if parsing
-- was partial (e.g. low-confidence extraction).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists reports (
  -- Identity
  id              uuid         primary key default gen_random_uuid(),
  ticket_number   text         not null unique,          -- RPT-YYYY-NNNN
  raw_message_id  uuid         references raw_messages(id) on delete set null,

  -- Citizen / channel
  citizen_ref     text         not null,                 -- sender_ref from raw_message
  channel         text         not null check (channel in ('telegram', 'sms')),

  -- LLM-extracted fields
  concern_type    text         not null default 'unknown',
  location_raw    text,                                  -- verbatim from message
  location_zone   text,                                  -- extracted zone/area
  location_landmark text,                               -- extracted landmark
  urgency_level   text         not null default 'low'
                    check (urgency_level in ('critical', 'high', 'medium', 'low')),
  summary         text         not null default '',
  affected_persons jsonb,                               -- { count, groups[] }
  original_language text,                               -- cebuano | filipino | english | mixed
  suggested_office text,
  suggested_action text,
  llm_confidence  numeric      check (llm_confidence between 0 and 1),

  -- Reply tracking
  auto_reply_text  text,                               -- LLM draft with ticket substituted
  auto_reply_sent  boolean     not null default false,
  staff_reply_text text,
  staff_reply_sent boolean     not null default false,

  -- Staff workflow
  status          text         not null default 'new'
                    check (status in ('new', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
  assigned_office text,

  -- Timestamps
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  resolved_at     timestamptz
);

-- Indexes for dashboard filtering and sorting
create index idx_reports_status    on reports (status);
create index idx_reports_urgency   on reports (urgency_level);
create index idx_reports_concern   on reports (concern_type);
create index idx_reports_citizen   on reports (citizen_ref);
create index idx_reports_created   on reports (created_at desc);
create index idx_reports_channel   on reports (channel);

-- Auto-update updated_at on any row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reports_updated_at
  before update on reports
  for each row execute function update_updated_at();
