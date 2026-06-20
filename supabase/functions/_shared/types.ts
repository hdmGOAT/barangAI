// ─────────────────────────────────────────────────────────────────────────────
// LihokBarangAI — Core Pipeline Types
// All I/O contracts between pipeline stages are defined here.
// Swap a stage by implementing its function type. Nothing else changes.
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Domain enums
// ---------------------------------------------------------------------------

export type Channel = "telegram" | "sms";

export type ConcernType =
  | "flooding"
  | "fire"
  | "medical_emergency"
  | "crime_security"
  | "infrastructure"
  | "garbage_sanitation"
  | "noise_disturbance"
  | "missing_person"
  | "request_assistance"
  | "general_inquiry"
  | "unknown";

export type UrgencyLevel = "critical" | "high" | "medium" | "low";

export type Language = "cebuano" | "filipino" | "english" | "mixed";

export type ReportStatus =
  | "new"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "dismissed";

export type ParseStatus = "pending" | "processing" | "done" | "failed";

// ---------------------------------------------------------------------------
// Pipeline stage I/O shapes
// ---------------------------------------------------------------------------

/**
 * Stage 1 output — normalized, channel-agnostic representation of an
 * incoming message. Produced by an IngestAdapter.
 */
export interface RawMessage {
  /** Internal UUID generated at ingest time. */
  id: string;
  channel: Channel;
  /** Unique ID from the external platform (Telegram update_id, SMS gateway msg id). */
  externalId: string;
  /** Channel-specific sender reference: Telegram chat_id or E.164 mobile number. */
  senderRef: string;
  text: string;
  receivedAt: string; // ISO 8601
  /** Full original webhook payload — kept for audit/replay. */
  rawPayload: unknown;
}

/**
 * Stage 2 output — structured data extracted by an LLM from a RawMessage.
 * Produced by a ReportParser.
 */
export interface ParsedReport {
  rawMessageId: string;
  citizenRef: string;
  channel: Channel;
  concernType: ConcernType;
  locationRaw: string | null;
  locationZone: string | null;
  locationLandmark: string | null;
  urgencyLevel: UrgencyLevel;
  /** 1–2 sentence English summary of the concern. */
  summary: string;
  affectedPersons: AffectedPersons;
  originalLanguage: Language;
  suggestedOffice: string | null;
  suggestedAction: string | null;
  /**
   * LLM-generated reply draft in the citizen's original language.
   * Contains the placeholder {TICKET_NUMBER} to be substituted at storage time.
   */
  replyDraft: string | null;
  /** 0.0–1.0 extraction confidence from the LLM. */
  confidence: number;
}

export interface AffectedPersons {
  count: number | null;
  groups: Array<"senior_citizen" | "children" | "pwds" | "general">;
}

/**
 * Stage 3 output — confirmed persisted record.
 * Produced by a ReportStorage implementation.
 */
export interface StoredReport {
  id: string;
  ticketNumber: string;
  rawMessage: RawMessage;
  parsedReport: ParsedReport;
  /** Reply text with {TICKET_NUMBER} substituted. */
  resolvedReplyText: string | null;
  status: ReportStatus;
  createdAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Pipeline stage function types
// ---------------------------------------------------------------------------

/**
 * Converts a raw webhook payload into a RawMessage.
 * Returns null to signal "skip" (e.g., non-text Telegram updates).
 * Swap this to change the ingest channel (Telegram → SMS).
 */
export type IngestAdapter = (payload: unknown) => RawMessage | null;

/**
 * Extracts structured data from a RawMessage using an AI/NLP backend.
 * Swap this to change the LLM provider (OpenAI → Gemini → local model).
 */
export type ReportParser = (raw: RawMessage) => Promise<ParsedReport>;

/**
 * Persists a RawMessage + ParsedReport and returns the stored record.
 * Swap this to change the database backend.
 */
export type ReportStorage = (
  raw: RawMessage,
  parsed: ParsedReport
) => Promise<StoredReport>;

/**
 * Sends a reply back to the citizen via the appropriate channel.
 * Optional stage — omit to disable auto-replies.
 * Swap this to change the reply channel (Telegram → SMS).
 */
export type ReplyHandler = (stored: StoredReport) => Promise<void>;
