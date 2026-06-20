-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: raw_messages
-- Immutable audit log. One row per incoming message, never updated after insert
-- (except parse_status). The external_message_id unique constraint provides
-- idempotency — replaying the same webhook payload is safe.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists raw_messages (
  id                   uuid         primary key,
  channel              text         not null check (channel in ('telegram', 'sms')),
  external_message_id  text         not null unique,   -- Telegram update_id or SMS gateway msg id
  sender_ref           text         not null,          -- Telegram chat_id or E.164 mobile number
  message_text         text         not null,
  received_at          timestamptz  not null,
  raw_payload          jsonb,                          -- full original webhook body (for replay/debug)
  parse_status         text         not null default 'pending'
                         check (parse_status in ('pending', 'processing', 'done', 'failed')),
  created_at           timestamptz  not null default now()
);

-- Index for dashboard queries by sender (citizen history)
create index idx_raw_messages_sender  on raw_messages (sender_ref);
create index idx_raw_messages_channel on raw_messages (channel);
create index idx_raw_messages_status  on raw_messages (parse_status);
