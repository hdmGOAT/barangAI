// ─────────────────────────────────────────────────────────────────────────────
// Adapter: SMS (stub)
// Ready to implement once an SMS gateway is chosen (Semaphore, Globe Labs, etc.)
// Drop in the gateway's payload shape and map to RawMessage — pipeline unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import type { IngestAdapter, RawMessage } from "../types.ts";

// ---------------------------------------------------------------------------
// Semaphore inbound payload shape (reference — uncomment when implementing)
// ---------------------------------------------------------------------------
//
// interface SemaphoreInboundMessage {
//   senderId:  string   // mobile number of the sender
//   message:   string   // raw SMS text
//   network:   string   // 'globe' | 'smart' | 'sun'
//   timestamp: string   // ISO 8601
//   messageId: string   // gateway-assigned unique ID
// }

// ---------------------------------------------------------------------------
// Adapter stub
// ---------------------------------------------------------------------------

/**
 * TODO: Implement this adapter when switching to SMS in production.
 *
 * Steps:
 * 1. Cast `payload` to your chosen gateway's inbound message shape.
 * 2. Validate/normalize the mobile number to E.164 (+639XXXXXXXXX).
 * 3. Return a RawMessage with channel: 'sms'.
 * 4. In supabase/functions/ingest/index.ts, swap telegramAdapter for smsAdapter.
 *    The rest of the pipeline (parser, storage, reply) stays identical.
 */
export const smsAdapter: IngestAdapter = (_payload: unknown): RawMessage | null => {
  throw new Error(
    "smsAdapter is not yet implemented. " +
    "Choose an SMS gateway (Semaphore / Globe Labs / Twilio) and implement this adapter."
  );
};
