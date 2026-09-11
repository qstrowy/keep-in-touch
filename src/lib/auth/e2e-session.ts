import type { User } from "@supabase/supabase-js";

export const E2E_TEST_OWNER_HEADER = "x-keep-in-touch-e2e-owner";

const TEST_USERS = {
  "owner-a": {
    id: "e2e-owner-a",
    email: "owner-a@example.test",
  },
  "owner-b": {
    id: "e2e-owner-b",
    email: "owner-b@example.test",
  },
} as const;

type TestOwner = keyof typeof TEST_USERS;

export function isE2ETestModeEnabled(): boolean {
  return import.meta.env.MODE !== "production" && import.meta.env.KEEP_IN_TOUCH_E2E === "1";
}

export function getE2ETestUser(request: Request): User | null {
  if (!isE2ETestModeEnabled()) {
    return null;
  }

  const owner = request.headers.get(E2E_TEST_OWNER_HEADER);
  if (!isTestOwner(owner)) {
    return null;
  }

  const testUser = TEST_USERS[owner];
  return {
    id: testUser.id,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    aud: "authenticated",
    email: testUser.email,
    role: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

function isTestOwner(value: string | null): value is TestOwner {
  return value === "owner-a" || value === "owner-b";
}
