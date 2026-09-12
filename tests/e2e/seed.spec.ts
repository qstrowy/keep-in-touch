import { expect, test } from "@playwright/test";

import { authenticateAsOwner, OWNER_A } from "./fixtures/auth";

test("risk #6: a signed-in owner can create and delete a person", async ({ page }) => {
  const displayName = `Seed person ${Date.now()}`;

  await authenticateAsOwner(page, OWNER_A);
  await page.goto("/dashboard");

  await page.getByLabel("Name").fill(displayName);
  await page.getByRole("combobox", { name: "Relationship circle" }).selectOption("family");
  await page.getByRole("button", { name: "Save person", exact: true }).click();
  await expect(page.getByRole("heading", { name: displayName, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete person" }).click();
  await expect(page.getByRole("heading", { name: `Delete ${displayName} permanently?` })).toBeVisible();
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("heading", { name: displayName, exact: true })).toHaveCount(0);
});
