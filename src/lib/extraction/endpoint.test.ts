import { describe, expect, it, vi } from "vitest";

import { handleExtractionRequest, MAX_EXTRACTION_REQUEST_BYTES } from "./endpoint";

function request(body: string, options: { origin?: string; contentType?: string; method?: string } = {}) {
  return new Request("https://keep.example.test/api/extractions/anchors", {
    method: options.method ?? "POST",
    headers: {
      Origin: options.origin ?? "https://keep.example.test",
      "Content-Type": options.contentType ?? "application/json",
    },
    body,
  });
}

function dependencies() {
  const extract = vi.fn().mockResolvedValue({
    ok: true as const,
    response: { topics: [{ text: "Recital", questions: [] }] },
  });
  return {
    extract,
    dependencies: {
      origin: "https://keep.example.test",
      authenticate: vi.fn().mockResolvedValue(true),
      extract,
    },
  };
}

describe("extraction endpoint", () => {
  it("accepts an authenticated same-origin exact note request", async () => {
    const { dependencies: handlerDependencies, extract } = dependencies();

    const response = await handleExtractionRequest(request('{"note":"Ask about the recital."}'), handlerDependencies);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ topics: [{ text: "Recital", questions: [] }] });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(extract).toHaveBeenCalledWith({ note: "Ask about the recital." });
  });

  it("rejects cross-origin, unauthenticated, malformed, unexpected, and oversized requests before extraction", async () => {
    const { dependencies: handlerDependencies, extract } = dependencies();

    await expect(
      handleExtractionRequest(
        request('{"note":"Private"}', { origin: "https://other.example.test" }),
        handlerDependencies,
      ),
    ).resolves.toHaveProperty("status", 403);
    await expect(
      handleExtractionRequest(request('{"note":"Private","personId":"do-not-send"}'), handlerDependencies),
    ).resolves.toHaveProperty("status", 400);
    await expect(handleExtractionRequest(request("not-json"), handlerDependencies)).resolves.toHaveProperty(
      "status",
      400,
    );
    await expect(
      handleExtractionRequest(
        request('{"note":"Private"}'.padEnd(MAX_EXTRACTION_REQUEST_BYTES + 1, " ")),
        handlerDependencies,
      ),
    ).resolves.toHaveProperty("status", 413);
    await expect(
      handleExtractionRequest(request('{"note":"Private"}'), {
        ...handlerDependencies,
        authenticate: vi.fn().mockResolvedValue(false),
      }),
    ).resolves.toHaveProperty("status", 401);
    expect(extract).not.toHaveBeenCalled();
  });

  it("maps provider failures to neutral status-only errors", async () => {
    const { dependencies: handlerDependencies } = dependencies();

    const timeoutResponse = await handleExtractionRequest(request('{"note":"Private"}'), {
      ...handlerDependencies,
      extract: vi.fn().mockResolvedValue({ ok: false, error: "timeout" }),
    });
    const invalidResponse = await handleExtractionRequest(request('{"note":"Private"}'), {
      ...handlerDependencies,
      extract: vi.fn().mockResolvedValue({ ok: false, error: "invalid_response" }),
    });

    expect(timeoutResponse.status).toBe(504);
    await expect(timeoutResponse.json()).resolves.toEqual({ error: "timeout" });
    expect(invalidResponse.status).toBe(502);
    await expect(invalidResponse.json()).resolves.toEqual({ error: "invalid_response" });
  });
});
