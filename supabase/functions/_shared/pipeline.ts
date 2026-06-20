// ─────────────────────────────────────────────────────────────────────────────
// LihokBarangAI — Pipeline Runner
// Orchestrates the four stages: adapt → parse → store → reply
// Each stage is independently swappable via the PipelineStages config.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  RawMessage,
  ParsedReport,
  StoredReport,
  IngestAdapter,
  ReportParser,
  ReportStorage,
  ReplyHandler,
} from "./types.ts";

export interface PipelineStages {
  /** Normalizes the raw webhook payload into a RawMessage. */
  adapter: IngestAdapter;
  /** Extracts structured data from the message text using an AI backend. */
  parser: ReportParser;
  /** Persists the raw + parsed data and returns the stored record. */
  storage: ReportStorage;
  /** Sends a reply back to the citizen. Optional — omit to skip replies. */
  reply?: ReplyHandler;
}

export type PipelineStage = "adapt" | "parse" | "store" | "reply";

export interface PipelineResult {
  success: boolean;
  /** True when the adapter returned null (non-text update — intentionally skipped). */
  skipped?: boolean;
  stored?: StoredReport;
  error?: string;
  /** Which stage failed, if any. */
  failedAt?: PipelineStage;
  /** The normalized message, if successfully adapted. */
  raw?: RawMessage;
}

/**
 * Runs a message through the full pipeline.
 *
 * Design contract:
 * - Each stage receives only the output of the previous stage (no shared state).
 * - Reply failures are logged but do NOT fail the overall result — the report
 *   is already persisted and can be re-delivered separately.
 * - The function always resolves (never throws) so callers can safely return
 *   HTTP 200 to the webhook regardless of internal errors.
 */
export async function runPipeline(
  payload: unknown,
  stages: PipelineStages
): Promise<PipelineResult> {
  // ── Stage 1: Adapt ────────────────────────────────────────────────────────
  let raw: RawMessage | null;
  try {
    raw = stages.adapter(payload);
  } catch (err) {
    return {
      success: false,
      failedAt: "adapt",
      error: errorMessage(err),
    };
  }

  // Adapter returning null means "this update is not actionable" (e.g. a
  // Telegram sticker, photo-only message, or service notification).
  if (raw === null) {
    return { success: true, skipped: true };
  }

  // ── Stage 2: Parse ────────────────────────────────────────────────────────
  let parsed: ParsedReport;
  try {
    parsed = await stages.parser(raw);
  } catch (err) {
    return {
      success: false,
      failedAt: "parse",
      error: errorMessage(err),
      raw,
    };
  }

  // ── Stage 3: Store ────────────────────────────────────────────────────────
  let stored: StoredReport;
  try {
    stored = await stages.storage(raw, parsed);
  } catch (err) {
    return {
      success: false,
      failedAt: "store",
      error: errorMessage(err),
      raw,
    };
  }

  // ── Stage 4: Reply (optional, non-fatal) ──────────────────────────────────
  if (stages.reply) {
    try {
      await stages.reply(stored);
    } catch (err) {
      // Intentionally not returning failure — store succeeded, reply can retry.
      console.error(
        `[pipeline] reply stage failed for ticket ${stored.ticketNumber}:`,
        errorMessage(err)
      );
    }
  }

  return { success: true, stored, raw };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
