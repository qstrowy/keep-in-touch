import {
  createExtractionProviderInput,
  parseExtractionCandidateResponse,
  type ExtractionCandidateResponse,
  type ExtractionRequest,
} from "./contract";

const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
export const EXTRACTION_TIMEOUT_MS = 90_000;

const EXTRACTION_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "core_topics",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        topics: {
          type: "array",
          maxItems: 7,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              text: { type: "string", minLength: 1, maxLength: 500 },
              questions: {
                type: "array",
                maxItems: 3,
                items: { type: "string", minLength: 1, maxLength: 500 },
              },
            },
            required: ["text", "questions"],
          },
        },
      },
      required: ["topics"],
    },
  },
} as const;

export interface OpenRouterConfiguration {
  apiKey: string | undefined;
  model: string | undefined;
  provider: string | undefined;
}

export interface OpenRouterExtractorOptions {
  fetchFn?: ExtractionFetch;
  timeoutMs?: number;
}

export type ExtractionFetch = (url: string, init: RequestInit) => Promise<Response>;

export interface OpenRouterExtractionDiagnostics {
  requestId: string;
  httpReferer: string;
  report(event: OpenRouterExtractionDiagnosticEvent): void;
}

export interface OpenRouterExtractionDiagnosticEvent {
  requestId: string;
  stage:
    | "provider_request_started"
    | "provider_response_received"
    | "provider_body_read_started"
    | "provider_body_read_finished"
    | "provider_timeout"
    | "provider_unavailable"
    | "provider_invalid_response"
    | "provider_success";
  elapsedMs: number;
  status?: number;
  openRouterRequestId?: string;
  bodyBytes?: number;
}

export type OpenRouterExtractionResult =
  | { ok: true; response: ExtractionCandidateResponse }
  | { ok: false; error: "unavailable" | "timeout" | "invalid_response" };

export interface OpenRouterExtractor {
  extract(
    request: ExtractionRequest,
    diagnostics?: OpenRouterExtractionDiagnostics,
  ): Promise<OpenRouterExtractionResult>;
}

export function createOpenRouterExtractor(
  configuration: OpenRouterConfiguration,
  options: OpenRouterExtractorOptions = {},
): OpenRouterExtractor {
  const apiKey = configuration.apiKey?.trim();
  const model = configuration.model?.trim();
  const provider = configuration.provider?.trim();
  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? EXTRACTION_TIMEOUT_MS;

  return {
    async extract(request, diagnostics?: OpenRouterExtractionDiagnostics) {
      if (!apiKey || !model || !provider) {
        reportDiagnostic(diagnostics, {
          stage: "provider_unavailable",
          elapsedMs: 0,
        });
        return { ok: false, error: "unavailable" };
      }

      const controller = new AbortController();
      const startedAt = Date.now();
      const timeout = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      const providerInput = createExtractionProviderInput(request);

      try {
        reportDiagnostic(diagnostics, {
          stage: "provider_request_started",
          elapsedMs: elapsedMs(startedAt),
        });
        const response = await fetchFn(OPENROUTER_CHAT_COMPLETIONS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...(diagnostics
              ? {
                  "HTTP-Referer": diagnostics.httpReferer,
                  "X-OpenRouter-Title": "KeepInTouch local extraction",
                }
              : {}),
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: providerInput.instruction },
              {
                role: "user",
                content: JSON.stringify({ note: providerInput.note, excludedTopics: providerInput.excludedTopics }),
              },
            ],
            provider: {
              only: [provider],
              allow_fallbacks: false,
              require_parameters: true,
              data_collection: "deny",
              zdr: true,
            },
            response_format: EXTRACTION_RESPONSE_FORMAT,
            reasoning: { effort: "none" },
            stream: false,
          }),
          signal: controller.signal,
        });

        reportDiagnostic(diagnostics, {
          stage: "provider_response_received",
          elapsedMs: elapsedMs(startedAt),
          status: response.status,
          openRouterRequestId: response.headers.get("x-request-id") ?? undefined,
        });
        if (!response.ok) {
          reportDiagnostic(diagnostics, {
            stage: "provider_unavailable",
            elapsedMs: elapsedMs(startedAt),
            status: response.status,
            openRouterRequestId: response.headers.get("x-request-id") ?? undefined,
          });
          return { ok: false, error: "unavailable" };
        }

        reportDiagnostic(diagnostics, {
          stage: "provider_body_read_started",
          elapsedMs: elapsedMs(startedAt),
          status: response.status,
          openRouterRequestId: response.headers.get("x-request-id") ?? undefined,
        });
        const responseText = await response.text();
        reportDiagnostic(diagnostics, {
          stage: "provider_body_read_finished",
          elapsedMs: elapsedMs(startedAt),
          status: response.status,
          openRouterRequestId: response.headers.get("x-request-id") ?? undefined,
          bodyBytes: new TextEncoder().encode(responseText).byteLength,
        });
        const content = responseContent(responseText);
        if (!content) {
          reportDiagnostic(diagnostics, {
            stage: "provider_invalid_response",
            elapsedMs: elapsedMs(startedAt),
            status: response.status,
            openRouterRequestId: response.headers.get("x-request-id") ?? undefined,
          });
          return { ok: false, error: "invalid_response" };
        }

        const candidateResponse = parseExtractionCandidateResponse(parseJson(content));
        if (!candidateResponse) {
          reportDiagnostic(diagnostics, {
            stage: "provider_invalid_response",
            elapsedMs: elapsedMs(startedAt),
            status: response.status,
            openRouterRequestId: response.headers.get("x-request-id") ?? undefined,
          });
          return { ok: false, error: "invalid_response" };
        }

        reportDiagnostic(diagnostics, {
          stage: "provider_success",
          elapsedMs: elapsedMs(startedAt),
          status: response.status,
          openRouterRequestId: response.headers.get("x-request-id") ?? undefined,
        });
        return { ok: true, response: candidateResponse };
      } catch (error) {
        const timedOut = isAbortError(error, controller.signal);
        reportDiagnostic(diagnostics, {
          stage: timedOut ? "provider_timeout" : "provider_unavailable",
          elapsedMs: elapsedMs(startedAt),
        });
        return { ok: false, error: timedOut ? "timeout" : "unavailable" };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function reportDiagnostic(
  diagnostics: OpenRouterExtractionDiagnostics | undefined,
  event: Omit<OpenRouterExtractionDiagnosticEvent, "requestId">,
): void {
  diagnostics?.report({ requestId: diagnostics.requestId, ...event });
}

function elapsedMs(startedAt: number): number {
  return Date.now() - startedAt;
}

function responseContent(responseText: string): string | null {
  const body = parseJson(responseText);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const choices = record.choices;
  if (!isUnknownArray(choices) || choices.length !== 1) {
    return null;
  }
  const choice: unknown = choices[0];
  if (!choice || typeof choice !== "object" || Array.isArray(choice) || !("message" in choice)) {
    return null;
  }

  const message = (choice as Record<string, unknown>).message;
  if (!message || typeof message !== "object" || Array.isArray(message) || !("content" in message)) {
    return null;
  }

  const content = (message as Record<string, unknown>).content;
  return typeof content === "string" ? content : null;
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return null;
  }
}

function isAbortError(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error instanceof DOMException && error.name === "AbortError");
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
