// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: ingest
// Single entry point for all incoming messages.
//
// This file wires the pipeline stages together. It is the ONLY place that
// reads environment variables and selects concrete implementations.
// To swap a component: change the import + constructor call below.
// ─────────────────────────────────────────────────────────────────────────────

import { runPipeline } from "../_shared/pipeline.ts";

// ── Adapters (choose one) ────────────────────────────────────────────────────
import { telegramAdapter } from "../_shared/adapters/telegram.ts";
// import { smsAdapter } from "../_shared/adapters/sms.ts";  // ← swap for SMS

// ── Parsers (choose one) ─────────────────────────────────────────────────────
// import { createOpenAIParser } from "../_shared/parsers/openai.ts";  // ← swap for OpenAI
import { createGeminiParser } from "../_shared/parsers/gemini.ts";

// ── Storage (choose one) ─────────────────────────────────────────────────────
import { createSupabaseStorage } from "../_shared/storage/supabase.ts";

// ── Reply handlers (choose one, or omit to disable auto-reply) ───────────────
import { createTelegramReplyHandler } from "../_shared/reply/telegram.ts";
// import { createSMSReplyHandler } from "../_shared/reply/sms.ts";  // ← swap for SMS

// ---------------------------------------------------------------------------
// Environment — resolved once at cold-start, not per-request
// ---------------------------------------------------------------------------

const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ---------------------------------------------------------------------------
// Pipeline — assembled once at cold-start
// ---------------------------------------------------------------------------

const pipeline = {
  adapter: telegramAdapter,
  parser:  createGeminiParser(GEMINI_API_KEY),
  storage: createSupabaseStorage(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
  reply:   createTelegramReplyHandler(TELEGRAM_BOT_TOKEN),
};

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // ── Auth: verify Telegram webhook secret ──────────────────────────────────
  const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (incomingSecret !== TELEGRAM_WEBHOOK_SECRET) {
    console.warn("[ingest] Rejected request — invalid webhook secret");
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad Request: invalid JSON", { status: 400 });
  }

  // ── Run pipeline ──────────────────────────────────────────────────────────
  const result = await runPipeline(payload, pipeline);

  if (result.skipped) {
    // Non-text update (photo, sticker, etc.) — not an error, just ignore
    return new Response("OK");
  }

  if (!result.success) {
    // Always return 200 to Telegram — a non-200 triggers aggressive retries
    // which we don't want when the failure is on our side.
    console.error(
      `[ingest] Pipeline failed at stage "${result.failedAt}": ${result.error}`
    );

    // If the pipeline failed after the adapter succeeded, notify the citizen of temporary maintenance
    if (result.raw) {
      try {
        if (result.raw.channel === "telegram" && TELEGRAM_BOT_TOKEN) {
          const apiBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
          const maintenanceMessage = 
            `⚠️ *System Notice / Pahibalo:*\n\n` +
            `Pasensya, Dili ko kareply karon kay adunay maintenance na gahitabo.\n\n` +
            `_Paumanhin, hindi ako makasagot ngayon dahil may kasalukuyang maintenance._`;

          const res = await fetch(`${apiBase}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: result.raw.senderRef,
              text: maintenanceMessage,
              parse_mode: "Markdown",
            }),
          });

          if (!res.ok) {
            console.error(
              `[ingest] Failed to send maintenance notification: ${res.status} ${res.statusText}`
            );
          }
        }
      } catch (replyErr) {
        console.error("[ingest] Error sending maintenance notification:", replyErr);
      }
    }

    return new Response("OK");
  }

  console.log(
    `[ingest] ✓ Report stored: ${result.stored?.ticketNumber} ` +
    `(${result.stored?.parsedReport.concernType}, ${result.stored?.parsedReport.urgencyLevel})`
  );

  return new Response("OK");
});
