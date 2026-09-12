import { expect, test } from "@playwright/test";

import { authenticateAsOwner, OWNER_A } from "./fixtures/auth";

test("risk #6: an edited person remains updated after page reload", async ({ page }) => {
  const originalName = `Editable person ${Date.now()}`;
  const updatedName = `${originalName} updated`;

  await authenticateAsOwner(page, OWNER_A);
  await page.goto("/dashboard");

  await page.getByLabel("Name").fill(originalName);
  await page.getByRole("combobox", { name: "Relationship circle" }).selectOption("friend");
  await page.getByRole("button", { name: "Save person", exact: true }).click();
  await expect(page.getByRole("heading", { name: originalName, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Edit person" }).click();
  await page.getByLabel("Name").fill(updatedName);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: updatedName, exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: updatedName, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: originalName, exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Delete person" }).click();
  await expect(page.getByRole("heading", { name: `Delete ${updatedName} permanently?` })).toBeVisible();
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("heading", { name: updatedName, exact: true })).toHaveCount(0);
});
