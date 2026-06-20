// ─────────────────────────────────────────────────────────────────────────────
// Storage: Supabase
// Persists a RawMessage + ParsedReport to the database.
// Returns a StoredReport with the generated ticket number.
//
// To swap the database: implement ReportStorage in a sibling file.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type {
  ReportStorage,
  RawMessage,
  ParsedReport,
  StoredReport,
} from "../types.ts";

// ---------------------------------------------------------------------------
// Ticket number generation
// ---------------------------------------------------------------------------

/**
 * Generates a human-readable ticket number: RPT-YYYY-NNNN
 * Uses a DB count for the sequence — good enough for demo scale.
 * Replace with a Postgres sequence (`serial` / `generated always`) in production.
 */
async function generateTicketNumber(supabase: SupabaseClient): Promise<string> {
  const year = new Date().getFullYear();
  const { count, error } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(`Ticket count query failed: ${error.message}`);

  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `RPT-${year}-${seq}`;
}

// ---------------------------------------------------------------------------
// Storage factory
// ---------------------------------------------------------------------------

/**
 * Creates a Supabase-backed ReportStorage.
 *
 * Both `raw_messages` and `reports` are written in the same call.
 * raw_messages uses upsert on external_message_id for idempotency — safe to
 * retry if the pipeline is replayed.
 */
export function createSupabaseStorage(
  supabaseUrl: string,
  serviceRoleKey: string
): ReportStorage {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  return async (
    raw: RawMessage,
    parsed: ParsedReport
  ): Promise<StoredReport> => {
    // ── Step 1: Upsert raw_messages (idempotent on external_message_id) ──────
    const { data: rawRow, error: rawErr } = await supabase
      .from("raw_messages")
      .upsert(
        {
          id: raw.id,
          channel: raw.channel,
          external_message_id: raw.externalId,
          sender_ref: raw.senderRef,
          message_text: raw.text,
          received_at: raw.receivedAt,
          raw_payload: raw.rawPayload,
          parse_status: "done",
        },
        { onConflict: "external_message_id" }
      )
      .select()
      .single();

    if (rawErr) throw new Error(`raw_messages upsert failed: ${rawErr.message}`);

    // ── Step 2: Generate ticket number ────────────────────────────────────────
    const ticketNumber = await generateTicketNumber(supabase);

    // ── Step 3: Substitute ticket into reply draft ────────────────────────────
    const resolvedReplyText =
      parsed.replyDraft?.replace("{TICKET_NUMBER}", ticketNumber) ?? null;

    // ── Step 4: Insert report ─────────────────────────────────────────────────
    const { data: reportRow, error: reportErr } = await supabase
      .from("reports")
      .insert({
        ticket_number: ticketNumber,
        raw_message_id: rawRow.id,
        citizen_ref: parsed.citizenRef,
        channel: parsed.channel,
        concern_type: parsed.concernType,
        location_raw: parsed.locationRaw,
        location_zone: parsed.locationZone,
        location_landmark: parsed.locationLandmark,
        urgency_level: parsed.urgencyLevel,
        summary: parsed.summary,
        affected_persons: parsed.affectedPersons,
        original_language: parsed.originalLanguage,
        suggested_office: parsed.suggestedOffice,
        suggested_action: parsed.suggestedAction,
        llm_confidence: parsed.confidence,
        auto_reply_text: resolvedReplyText,
        status: "new",
      })
      .select()
      .single();

    if (reportErr)
      throw new Error(`reports insert failed: ${reportErr.message}`);

    return {
      id: reportRow.id,
      ticketNumber,
      rawMessage: raw,
      parsedReport: parsed,
      resolvedReplyText,
      status: "new",
      createdAt: reportRow.created_at,
    };
  };
}
