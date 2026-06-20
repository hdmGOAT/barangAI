// ─────────────────────────────────────────────────────────────────────────────
// Reply Handler: Telegram
// Sends the LLM-generated confirmation message back to the citizen.
// Swap this for sms.ts when switching to SMS in production.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReplyHandler, StoredReport } from "../types.ts";

// ---------------------------------------------------------------------------
// Reply handler factory
// ---------------------------------------------------------------------------

/**
 * Creates a Telegram-backed ReplyHandler.
 *
 * Sends `stored.resolvedReplyText` to the citizen's chat_id (senderRef).
 * If no reply text is available (LLM didn't generate one), sends a safe fallback.
 */
export function createTelegramReplyHandler(botToken: string): ReplyHandler {
  const apiBase = `https://api.telegram.org/bot${botToken}`;

  return async (stored: StoredReport): Promise<void> => {
    const text =
      stored.resolvedReplyText ??
      buildFallbackReply(stored);

    const res = await fetch(`${apiBase}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: stored.rawMessage.senderRef,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Telegram sendMessage failed ${res.status}: ${body}`);
    }
  };
}

// ---------------------------------------------------------------------------
// Fallback reply (when LLM reply_draft is null or empty)
// ---------------------------------------------------------------------------

function buildFallbackReply(stored: StoredReport): string {
  // Bilingual fallback — covers both Cebuano and Filipino readers
  return (
    `✅ *Nadawat ang imong report / Natanggap ang iyong ulat.*\n\n` +
    `🎫 Ticket: \`${stored.ticketNumber}\`\n` +
    `📋 Concern: ${stored.parsedReport.concernType.replace(/_/g, " ")}\n` +
    `⚠️ Urgency: ${stored.parsedReport.urgencyLevel}\n\n` +
    `_Aksyon dayon ang among team / Aaksyunan ng aming team ang iyong concern._`
  );
}
