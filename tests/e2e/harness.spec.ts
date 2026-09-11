import { expect, test } from "@playwright/test";

import { authenticateAsOwner, OWNER_A, OWNER_B, signOut } from "./fixtures/auth";

test("runs signed-out and fixed owner sessions through the dashboard route", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/signin$/);

  await authenticateAsOwner(page, OWNER_A);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your people" })).toBeVisible();

  await signOut(page);
  await authenticateAsOwner(page, OWNER_B);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your people" })).toBeVisible();

  expect(OWNER_A.id).not.toBe(OWNER_B.id);
});
