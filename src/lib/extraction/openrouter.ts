import {
  createExtractionProviderInput,
  parseExtractionCandidateResponse,
  type ExtractionCandidateResponse,
  type ExtractionRequest,
} from "./contract";

const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
export const EXTRACTION_TIMEOUT_MS = 90_000;

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

export type OpenRouterExtractionResult =
  | { ok: true; response: ExtractionCandidateResponse }
  | { ok: false; error: "unavailable" | "timeout" | "invalid_response" };

export function createOpenRouterExtractor(
  configuration: OpenRouterConfiguration,
  options: OpenRouterExtractorOptions = {},
): { extract(request: ExtractionRequest): Promise<OpenRouterExtractionResult> } {
  const apiKey = configuration.apiKey?.trim();
  const model = configuration.model?.trim();
  const provider = configuration.provider?.trim();
  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? EXTRACTION_TIMEOUT_MS;

  return {
    async extract(request) {
      if (!apiKey || !model || !provider) {
        return { ok: false, error: "unavailable" };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      const providerInput = createExtractionProviderInput(request);

      try {
        const response = await fetchFn(OPENROUTER_CHAT_COMPLETIONS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: providerInput.instruction },
              { role: "user", content: providerInput.note },
            ],
            provider: {
              only: [provider],
              allow_fallbacks: false,
              data_collection: "deny",
              zdr: true,
            },
            stream: false,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          return { ok: false, error: "unavailable" };
        }

        const content = await responseContent(response);
        if (!content) {
          return { ok: false, error: "invalid_response" };
        }

        const candidateResponse = parseExtractionCandidateResponse(parseJson(content));
        return candidateResponse ? { ok: true, response: candidateResponse } : { ok: false, error: "invalid_response" };
      } catch (error) {
        return { ok: false, error: isAbortError(error, controller.signal) ? "timeout" : "unavailable" };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

async function responseContent(response: Response): Promise<string | null> {
  const body = parseJson(await response.text());
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
