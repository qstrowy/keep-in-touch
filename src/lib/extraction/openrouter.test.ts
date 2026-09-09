import { describe, expect, it, vi } from "vitest";

import { createOpenRouterExtractor, EXTRACTION_TIMEOUT_MS, type ExtractionFetch } from "./openrouter";

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
          content:
            "Extract concise conversation anchors from the supplied interaction note. Return only JSON with a candidates array. Each candidate has kind topic, follow_up, or proposed_interaction and a concise text value. Do not invent details not supported by the note.",
        },
        { role: "user", content: "Ask about the recital." },
      ],
      provider: {
        only: ["example-provider"],
        allow_fallbacks: false,
        data_collection: "deny",
        zdr: true,
      },
      stream: false,
    });
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
