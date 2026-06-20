// ─────────────────────────────────────────────────────────────────────────────
// Parser: Gemini (gemini-3.5-flash)
// Drop-in replacement for openai.ts — identical ReportParser interface.
// Same system prompt, same output shape. Only the HTTP call differs.
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
// System prompt (identical to openai.ts — model-agnostic)
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
// Gemini API types (minimal)
// ---------------------------------------------------------------------------

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

// ---------------------------------------------------------------------------
// Shared extraction shape (same as openai.ts)
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

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Creates a Gemini-backed ReportParser.
 *
 * @param apiKey  Gemini API key — get from https://aistudio.google.com/apikey
 * @param model   Defaults to 'gemini-3.5-flash' — fast and cost-effective
 */
export function createGeminiParser(
  apiKey: string,
  model = "gemini-3.5-flash"
): ReportParser {
  const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  return async (raw: RawMessage): Promise<ParsedReport> => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: raw.text }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json", // forces structured JSON output
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${body}`);
    }

    const data: GeminiResponse = await response.json();

    // Check for content blocking
    if (data.promptFeedback?.blockReason) {
      throw new Error(
        `Gemini blocked the prompt: ${data.promptFeedback.blockReason}`
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty content");

    let extracted: LLMExtraction;
    try {
      extracted = JSON.parse(text);
    } catch {
      throw new Error(`Failed to parse Gemini JSON output: ${text}`);
    }

    return {
      rawMessageId:     raw.id,
      citizenRef:       raw.senderRef,
      channel:          raw.channel,
      concernType:      extracted.concern_type      ?? "unknown",
      locationRaw:      extracted.location_raw      ?? null,
      locationZone:     extracted.location_zone     ?? null,
      locationLandmark: extracted.location_landmark ?? null,
      urgencyLevel:     extracted.urgency_level     ?? "low",
      summary:          extracted.summary           ?? "",
      affectedPersons:  extracted.affected_persons  ?? { count: null, groups: [] },
      originalLanguage: extracted.original_language ?? "mixed",
      suggestedOffice:  extracted.suggested_office  ?? null,
      suggestedAction:  extracted.suggested_action  ?? null,
      replyDraft:       extracted.reply_draft       ?? null,
      confidence:       extracted.confidence        ?? 0,
    };
  };
}
