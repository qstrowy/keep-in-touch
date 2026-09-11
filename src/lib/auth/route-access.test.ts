import { describe, expect, it } from "vitest";

import { shouldRedirectUnauthenticated } from "./route-access";

describe("route access", () => {
  it("denies a missing session on protected routes", () => {
    expect(shouldRedirectUnauthenticated("/dashboard", null)).toBe(true);
    expect(shouldRedirectUnauthenticated("/dashboard/", null)).toBe(true);
  });

  it("allows an authenticated session on protected routes", () => {
    expect(shouldRedirectUnauthenticated("/dashboard", { id: "owner-a" })).toBe(false);
  });

  it("does not protect public routes", () => {
    expect(shouldRedirectUnauthenticated("/auth/signin", null)).toBe(false);
  });
});
