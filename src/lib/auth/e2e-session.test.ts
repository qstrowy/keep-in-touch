import { afterEach, describe, expect, it, vi } from "vitest";

import { E2E_TEST_OWNER_HEADER, getE2ETestUser, isE2ETestModeEnabled } from "./e2e-session";

describe("e2e session seam", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed unless the explicit test-server condition is enabled", () => {
    vi.stubEnv("KEEP_IN_TOUCH_E2E", "0");

    expect(isE2ETestModeEnabled()).toBe(false);
    expect(getE2ETestUser(new Request("http://localhost/dashboard"))).toBeNull();
  });

  it("maps only the fixed owner identities to server-derived user IDs", () => {
    vi.stubEnv("KEEP_IN_TOUCH_E2E", "1");

    const ownerA = getE2ETestUser(
      new Request("http://localhost/dashboard", { headers: { [E2E_TEST_OWNER_HEADER]: "owner-a" } }),
    );
    const ownerB = getE2ETestUser(
      new Request("http://localhost/dashboard", { headers: { [E2E_TEST_OWNER_HEADER]: "owner-b" } }),
    );

    expect(ownerA).toMatchObject({ id: "e2e-owner-a", email: "owner-a@example.test" });
    expect(ownerB).toMatchObject({ id: "e2e-owner-b", email: "owner-b@example.test" });
    expect(ownerA?.id).not.toBe(ownerB?.id);
  });

  it("rejects missing and arbitrary owner selectors", () => {
    vi.stubEnv("KEEP_IN_TOUCH_E2E", "1");

    expect(getE2ETestUser(new Request("http://localhost/dashboard"))).toBeNull();
    expect(
      getE2ETestUser(
        new Request("http://localhost/dashboard", {
          headers: { [E2E_TEST_OWNER_HEADER]: "arbitrary-owner-id" },
        }),
      ),
    ).toBeNull();
  });
});
