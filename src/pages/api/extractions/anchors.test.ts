import { describe, expect, it, vi } from "vitest";

import { handleExtractionRequest } from "../../../lib/extraction/endpoint";

function request(body: string, headers: Record<string, string> = {}) {
  return new Request("https://keep.example.test/api/extractions/anchors", {
    method: "POST",
    headers: {
      Origin: "https://keep.example.test",
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });
}

describe("anchor extraction route boundary", () => {
  it("forwards only the exact note body to the extraction dependency", async () => {
    const extract = vi.fn().mockResolvedValue({
      ok: true,
      response: { topics: [{ text: "Synthetic topic", questions: [] }] },
    });

    const response = await handleExtractionRequest(
      request(JSON.stringify({ note: "Synthetic note for acceptance" }), {
        Authorization: "Bearer browser-token",
        Cookie: "sb-auth=browser-cookie",
        "X-Person-Id": "person-1",
      }),
      {
        origin: "https://keep.example.test",
        authenticate: vi.fn().mockResolvedValue(true),
        extract,
      },
    );

    expect(response.status).toBe(200);
    expect(extract).toHaveBeenCalledOnce();
    expect(extract).toHaveBeenCalledWith({ note: "Synthetic note for acceptance" });
    expect(extract.mock.calls[0]?.[0]).not.toHaveProperty("personId");
    expect(extract.mock.calls[0]?.[0]).not.toHaveProperty("interactionId");
  });

  it("rejects the request before extraction when authentication fails", async () => {
    const extract = vi.fn();

    await expect(
      handleExtractionRequest(request(JSON.stringify({ note: "Synthetic note" })), {
        origin: "https://keep.example.test",
        authenticate: vi.fn().mockResolvedValue(false),
        extract,
      }),
    ).resolves.toHaveProperty("status", 401);
    expect(extract).not.toHaveBeenCalled();
  });
});
