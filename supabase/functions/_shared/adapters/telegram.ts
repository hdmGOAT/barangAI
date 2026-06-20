// ─────────────────────────────────────────────────────────────────────────────
// Adapter: Telegram
// Normalizes a Telegram Update webhook payload into a RawMessage.
// Swap this file for sms.ts (or any other) to change the ingest channel.
// ─────────────────────────────────────────────────────────────────────────────

import type { IngestAdapter, RawMessage } from "../types.ts";

// ---------------------------------------------------------------------------
// Telegram payload types (minimal — only what we actually use)
// ---------------------------------------------------------------------------

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
}

interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number; // Unix timestamp
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  // edited_message, channel_post, etc. intentionally ignored for now
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

/**
 * Converts a Telegram Update into a channel-agnostic RawMessage.
 *
 * Returns null for:
 * - Updates with no .message field (e.g. callback_query, poll answers)
 * - Messages without text (photos, stickers, documents, etc.)
 *
 * The senderRef is the Telegram chat_id as a string, which is stable per user
 * in private chats. In group chats it identifies the group, not the individual —
 * extend msg.from.id tracking if per-user identity in groups is needed.
 */
export const telegramAdapter: IngestAdapter = (
  payload: unknown
): RawMessage | null => {
  const update = payload as TelegramUpdate;

  if (!update?.message?.text) return null;

  const msg = update.message;

  return {
    id: crypto.randomUUID(),
    channel: "telegram",
    externalId: String(update.update_id),
    senderRef: String(msg.chat.id),
    text: msg.text,
    receivedAt: new Date(msg.date * 1000).toISOString(),
    rawPayload: payload,
  };
};
