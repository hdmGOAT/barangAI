// ─────────────────────────────────────────────────────────────────────────────
// Reply Handler: SMS (stub)
// Swap in for telegram.ts when switching to production SMS channel.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReplyHandler } from "../types.ts";

/**
 * TODO: Implement SMS reply handler.
 *
 * Steps:
 * 1. Pick a gateway: Semaphore (PH), Globe Labs, or Twilio.
 * 2. POST to the gateway's send API with:
 *      - to:      stored.rawMessage.senderRef  (E.164 mobile number)
 *      - message: stored.resolvedReplyText ?? buildFallbackReply(stored)
 * 3. In ingest/index.ts, replace createTelegramReplyHandler with createSMSReplyHandler.
 *
 * Semaphore reference:
 *   POST https://api.semaphore.co/api/v4/messages
 *   Body: { apikey, number, message, sendername }
 */
export function createSMSReplyHandler(_apiKey: string): ReplyHandler {
  return async (_stored) => {
    throw new Error(
      "createSMSReplyHandler is not yet implemented. " +
      "See the TODO comment in this file."
    );
  };
}
