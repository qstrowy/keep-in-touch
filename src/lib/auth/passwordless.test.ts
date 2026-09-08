import { describe, expect, it, vi } from "vitest";

import {
  CHECK_EMAIL_PATH,
  MAGIC_LINK_REQUEST_ERROR,
  MAGIC_LINK_RETRY_ERROR,
  PRIVATE_START_PATH,
  completeMagicLinkSignIn,
  isValidEmail,
  magicLinkCallbackUrl,
  normalizeEmail,
  requestMagicLink,
  signInErrorPath,
  type MagicLinkCodeExchange,
  type MagicLinkRequester,
} from "./passwordless";

function codeExchange(error: unknown) {
  const exchangeCodeForSession = vi.fn().mockResolvedValue({ error });

  return {
    exchange: {
      exchangeCodeForSession,
    } satisfies MagicLinkCodeExchange,
    exchangeCodeForSession,
  };
}

function magicLinkRequester(error: unknown) {
  const signInWithOtp = vi.fn().mockResolvedValue({ error });

  return {
    requester: {
      signInWithOtp,
    } satisfies MagicLinkRequester,
    signInWithOtp,
  };
}

describe("passwordless email handling", () => {
  it("normalizes a valid email before it reaches Supabase", () => {
    expect(normalizeEmail("  Owner@Example.com ")).toBe("owner@example.com");
    expect(isValidEmail("owner@example.com")).toBe(true);
  });

  it("rejects blank, malformed, and missing email values", () => {
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(isValidEmail("owner@example")).toBe(false);
  });
});

describe("passwordless request", () => {
  it("uses only the current origin callback and provisions the user on first use", async () => {
    const { requester, signInWithOtp } = magicLinkRequester(null);

    await expect(requestMagicLink("owner@example.com", "https://app.example.test/ignored", requester)).resolves.toBe(
      CHECK_EMAIL_PATH,
    );
    expect(magicLinkCallbackUrl("https://app.example.test/ignored")).toBe("https://app.example.test/api/auth/callback");
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "owner@example.com",
      options: {
        emailRedirectTo: "https://app.example.test/api/auth/callback",
        shouldCreateUser: true,
      },
    });
  });

  it("uses a neutral error path when configuration or the provider is unavailable", async () => {
    const expectedPath = signInErrorPath(MAGIC_LINK_REQUEST_ERROR);

    await expect(requestMagicLink("owner@example.com", "https://app.example.test", null)).resolves.toBe(expectedPath);
    await expect(
      requestMagicLink(
        "owner@example.com",
        "https://app.example.test",
        magicLinkRequester(new Error("SMTP disabled")).requester,
      ),
    ).resolves.toBe(expectedPath);
    expect(expectedPath).not.toContain("SMTP");
  });

  it("uses the same neutral error path when the provider request rejects", async () => {
    const requester: MagicLinkRequester = {
      signInWithOtp: vi.fn().mockRejectedValue(new Error("network failure")),
    };

    await expect(requestMagicLink("owner@example.com", "https://app.example.test", requester)).resolves.toBe(
      signInErrorPath(MAGIC_LINK_REQUEST_ERROR),
    );
  });
});

describe("passwordless callback", () => {
  it("exchanges a valid code and always enters the private dashboard", async () => {
    const { exchange, exchangeCodeForSession } = codeExchange(null);

    await expect(completeMagicLinkSignIn("valid-code", exchange)).resolves.toBe(PRIVATE_START_PATH);
    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
  });

  it("uses the generic retry path when no code or client is available", async () => {
    await expect(completeMagicLinkSignIn(null, codeExchange(null).exchange)).resolves.toBe(
      signInErrorPath(MAGIC_LINK_RETRY_ERROR),
    );
    await expect(completeMagicLinkSignIn("valid-code", null)).resolves.toBe(signInErrorPath(MAGIC_LINK_RETRY_ERROR));
  });

  it("uses the generic retry path when Supabase rejects the code", async () => {
    await expect(
      completeMagicLinkSignIn("used-code", codeExchange(new Error("code already used")).exchange),
    ).resolves.toBe(signInErrorPath(MAGIC_LINK_RETRY_ERROR));
  });

  it("uses the generic retry path when the exchange rejects", async () => {
    const exchange: MagicLinkCodeExchange = {
      exchangeCodeForSession: vi.fn().mockRejectedValue(new Error("network failure")),
    };

    await expect(completeMagicLinkSignIn("valid-code", exchange)).resolves.toBe(
      signInErrorPath(MAGIC_LINK_RETRY_ERROR),
    );
  });
});
