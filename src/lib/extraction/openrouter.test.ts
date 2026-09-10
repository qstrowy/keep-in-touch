import { describe, expect, it, vi } from "vitest";

import { createExtractionProviderInput } from "./contract";
import {
  createOpenRouterExtractor,
  EXTRACTION_TIMEOUT_MS,
  type ExtractionFetch,
  type OpenRouterExtractionDiagnosticEvent,
} from "./openrouter";

const configuration = {
  apiKey: "server-only-secret",
  model: "example-model",
  provider: "example-provider",
};

describe("OpenRouter extraction service", () => {
  it("sends only the fixed prompt and note through a pinned ZDR no-fallback route", async () => {
    const captured = { current: null as { url: string; init: RequestInit } | null };
    const fetchFn: ExtractionFetch = (url, init) => {
      captured.current = { url, init };
      return Promise.resolve(
        new Response(
          JSON.stringify({ choices: [{ message: { content: '{"candidates":[{"kind":"topic","text":"Recital"}]}' } }] }),
        ),
      );
    };
    const extractor = createOpenRouterExtractor(configuration, { fetchFn });

    await expect(extractor.extract({ note: "Ask about the recital." })).resolves.toEqual({
      ok: true,
      response: { candidates: [{ kind: "topic", text: "Recital" }] },
    });

    const capturedRequest = captured.current;
    if (!capturedRequest || typeof capturedRequest.init.body !== "string") {
      throw new Error("Expected an OpenRouter JSON request.");
    }
    expect(capturedRequest.url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(capturedRequest.init.headers).toEqual({
      Authorization: "Bearer server-only-secret",
      "Content-Type": "application/json",
    });
    const body = parseJson(capturedRequest.init.body);
    expect(body).toEqual({
      model: "example-model",
      messages: [
        {
          role: "system",
          content: createExtractionProviderInput({ note: "Ask about the recital." }).instruction,
        },
        { role: "user", content: "Ask about the recital." },
      ],
      provider: {
        only: ["example-provider"],
        allow_fallbacks: false,
        require_parameters: true,
        data_collection: "deny",
        zdr: true,
      },
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "extraction_candidates",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              candidates: {
                type: "array",
                maxItems: 12,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    kind: { type: "string", enum: ["topic", "follow_up", "proposed_interaction"] },
                    text: { type: "string", minLength: 1, maxLength: 500 },
                  },
                  required: ["kind", "text"],
                },
              },
            },
            required: ["candidates"],
          },
        },
      },
      reasoning: { effort: "none" },
      stream: false,
    });
  });

  it("emits privacy-safe local diagnostics and Activity attribution only when explicitly enabled", async () => {
    const events: OpenRouterExtractionDiagnosticEvent[] = [];
    const extractor = createOpenRouterExtractor(configuration, {
      fetchFn: (_url, init) => {
        expect(init.headers).toMatchObject({
          "HTTP-Referer": "http://localhost:4323",
          "X-OpenRouter-Title": "KeepInTouch local extraction",
        });
        return Promise.resolve(
          new Response(JSON.stringify({ choices: [{ message: { content: '{"candidates":[]}' } }] }), {
            headers: { "x-request-id": "openrouter-request" },
          }),
        );
      },
    });

    await expect(
      extractor.extract(
        { note: "Private note" },
        {
          requestId: "local-request",
          httpReferer: "http://localhost:4323",
          report: (event) => events.push(event),
        },
      ),
    ).resolves.toEqual({ ok: true, response: { candidates: [] } });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ requestId: "local-request", stage: "provider_request_started" }),
        expect.objectContaining({
          requestId: "local-request",
          stage: "provider_response_received",
          status: 200,
          openRouterRequestId: "openrouter-request",
        }),
        expect.objectContaining({
          requestId: "local-request",
          stage: "provider_body_read_started",
          status: 200,
        }),
        expect.objectContaining({
          requestId: "local-request",
          stage: "provider_body_read_finished",
          status: 200,
        }),
        expect.objectContaining({ requestId: "local-request", stage: "provider_success" }),
      ]),
    );
    expect(events.find((event) => event.stage === "provider_body_read_finished")?.bodyBytes).toBeGreaterThan(0);
    expect(JSON.stringify(events)).not.toContain("Private note");
  });

  it("fails neutrally when configuration, provider response, or content is unavailable", async () => {
    await expect(createOpenRouterExtractor({}).extract({ note: "Private note" })).resolves.toEqual({
      ok: false,
      error: "unavailable",
    });
    await expect(
      createOpenRouterExtractor(configuration, {
        fetchFn: vi.fn<ExtractionFetch>(() => Promise.resolve(new Response("", { status: 429 }))),
      }).extract({ note: "Private note" }),
    ).resolves.toEqual({ ok: false, error: "unavailable" });
    await expect(
      createOpenRouterExtractor(configuration, {
        fetchFn: vi.fn<ExtractionFetch>(() => Promise.resolve(new Response(JSON.stringify({ choices: [] })))),
      }).extract({ note: "Private note" }),
    ).resolves.toEqual({ ok: false, error: "invalid_response" });
  });

  it("aborts a stalled provider request at the configured deadline", async () => {
    const fetchFn = vi.fn<ExtractionFetch>(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    const extractor = createOpenRouterExtractor(configuration, { fetchFn, timeoutMs: 1 });

    await expect(extractor.extract({ note: "Private note" })).resolves.toEqual({ ok: false, error: "timeout" });
    expect(EXTRACTION_TIMEOUT_MS).toBe(90_000);
  });
});

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}
