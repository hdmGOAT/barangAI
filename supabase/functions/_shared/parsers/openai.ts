// ─────────────────────────────────────────────────────────────────────────────
// Parser: OpenAI (gpt-4o-mini)
// Extracts structured report data from unstructured citizen messages.
// Cebuano / Filipino / English / mixed language aware.
//
// To swap LLM provider: implement ReportParser in a sibling file (e.g. gemini.ts)
// and replace this import in ingest/index.ts. The pipeline is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ReportParser,
  RawMessage,
  ParsedReport,
  ConcernType,
  UrgencyLevel,
  Language,
  AffectedPersons,
} from "../types.ts";

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `\
You are an AI assistant for LihokBarangAI, a citizen reporting system for Filipino barangays.
Your job is to extract structured information from citizen messages sent via Telegram or SMS.
Messages may be in Cebuano, Tagalog, English, or any mixture (Taglish / Bisaya-English).

Return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

JSON shape:
{
  "concern_type": one of: "flooding" | "fire" | "medical_emergency" | "crime_security" | "infrastructure" | "garbage_sanitation" | "noise_disturbance" | "missing_person" | "request_assistance" | "general_inquiry" | "unknown",
  "location_raw": "<exact location phrase copied from the message, or null>",
  "location_zone": "<extracted zone, street, or area name, or null>",
  "location_landmark": "<nearest landmark mentioned, or null>",
  "urgency_level": one of: "critical" | "high" | "medium" | "low",
  "summary": "<1–2 sentence English summary of the concern>",
  "affected_persons": {
    "count": <integer or null>,
    "groups": array of zero or more: "senior_citizen" | "children" | "pwds" | "general"
  },
  "original_language": one of: "cebuano" | "filipino" | "english" | "mixed",
  "suggested_office": "<short office name: BDRRMC | BHC | POC | Public Works | Social Services, or null>",
  "suggested_action": "<brief recommended action for staff, or null>",
  "reply_draft": "<confirmation reply IN THE SAME LANGUAGE as the citizen's message — friendly, reassuring, short. Include the exact placeholder text {TICKET_NUMBER} where the ticket number should appear.>",
  "confidence": <float 0.0–1.0>
}

Urgency rules:
  critical — immediate danger to life (active fire, drowning, medical emergency, violent crime)
  high     — serious risk requiring fast response (rising flood, stranded person, missing person)
  medium   — important but not immediately life-threatening (broken road, outage, non-violent complaint)
  low      — general inquiry or minor concern

Office routing:
  BDRRMC         → flooding, fire, missing_person
  BHC            → medical_emergency
  POC            → crime_security, noise_disturbance
  Public Works   → infrastructure, garbage_sanitation
  Social Services→ request_assistance, missing_person

Examples:
  Input:  "Naay baha sa Zone 3, taas na ang tubig, naay senior citizen nga stranded near chapel."
  Output: { "concern_type": "flooding", "urgency_level": "critical", "suggested_office": "BDRRMC", ... }

  Input:  "May sunog sa Purok 4! Apektado ang 3 pamilya."
  Output: { "concern_type": "fire", "urgency_level": "critical", "suggested_office": "BDRRMC", ... }

  Input:  "Sira ang street light sa Purok 5 malapit sa eskwelahan. Delikado sa gabi."
  Output: { "concern_type": "infrastructure", "urgency_level": "medium", "suggested_office": "Public Works", ... }
`;

// ---------------------------------------------------------------------------
// LLM response shape (what OpenAI returns inside the JSON)
// ---------------------------------------------------------------------------

interface LLMExtraction {
  concern_type: ConcernType;
  location_raw: string | null;
  location_zone: string | null;
  location_landmark: string | null;
  urgency_level: UrgencyLevel;
  summary: string;
  affected_persons: AffectedPersons;
  original_language: Language;
  suggested_office: string | null;
  suggested_action: string | null;
  reply_draft: string | null;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Parser factory
// ---------------------------------------------------------------------------

/**
 * Creates an OpenAI-backed ReportParser.
 *
 * @param apiKey  OpenAI API key (from Deno.env)
 * @param model   Defaults to 'gpt-4o-mini' — cheap, fast, sufficient for extraction
 */
export function createOpenAIParser(
  apiKey: string,
  model = "gpt-4o-mini"
): ReportParser {
  return async (raw: RawMessage): Promise<ParsedReport> => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.1, // low temp = deterministic extraction
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: raw.text },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${body}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty content");

    let extracted: LLMExtraction;
    try {
      extracted = JSON.parse(content);
    } catch {
      throw new Error(`Failed to parse LLM JSON output: ${content}`);
    }

    return {
      rawMessageId: raw.id,
      citizenRef: raw.senderRef,
      channel: raw.channel,
      concernType: extracted.concern_type ?? "unknown",
      locationRaw: extracted.location_raw ?? null,
      locationZone: extracted.location_zone ?? null,
      locationLandmark: extracted.location_landmark ?? null,
      urgencyLevel: extracted.urgency_level ?? "low",
      summary: extracted.summary ?? "",
      affectedPersons: extracted.affected_persons ?? { count: null, groups: [] },
      originalLanguage: extracted.original_language ?? "mixed",
      suggestedOffice: extracted.suggested_office ?? null,
      suggestedAction: extracted.suggested_action ?? null,
      replyDraft: extracted.reply_draft ?? null,
      confidence: extracted.confidence ?? 0,
    };
  };
}
