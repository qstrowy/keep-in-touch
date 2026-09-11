import type { Page } from "@playwright/test";

export const OWNER_A = {
  headerValue: "owner-a",
  id: "e2e-owner-a",
} as const;

export const OWNER_B = {
  headerValue: "owner-b",
  id: "e2e-owner-b",
} as const;

const OWNER_HEADER = "x-keep-in-touch-e2e-owner";

export async function authenticateAsOwner(page: Page, owner: typeof OWNER_A | typeof OWNER_B) {
  await page.setExtraHTTPHeaders({ [OWNER_HEADER]: owner.headerValue });
}

export async function signOut(page: Page) {
  await page.setExtraHTTPHeaders({});
}
