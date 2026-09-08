import { describe, expect, it, vi } from "vitest";

import {
  MAGIC_LINK_RETRY_ERROR,
  PRIVATE_START_PATH,
  completeMagicLinkSignIn,
  signInErrorPath,
  type MagicLinkCodeExchange,
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
});
