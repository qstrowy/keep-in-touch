import { expect, test } from "@playwright/test";

import { authenticateAsOwner, OWNER_A, OWNER_B, signOut } from "./fixtures/auth";

const OWNER_A_PERSON = "Browser smoke owner A";
const OWNER_B_PERSON = "Browser smoke owner B";

test("isolates owner-local people across signed-out document navigation", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/signin$/);

  await authenticateAsOwner(page, OWNER_A);
  await page.goto("/dashboard");
  await createPerson(page, OWNER_A_PERSON);
  await expect(page.getByRole("heading", { name: OWNER_A_PERSON, exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: OWNER_A_PERSON, exact: true })).toBeVisible();

  await signOut(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/signin$/);

  await authenticateAsOwner(page, OWNER_B);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: OWNER_A_PERSON, exact: true })).toHaveCount(0);
  await createPerson(page, OWNER_B_PERSON);
  await expect(page.getByRole("heading", { name: OWNER_B_PERSON, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: OWNER_A_PERSON, exact: true })).toHaveCount(0);

  await signOut(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/signin$/);

  await authenticateAsOwner(page, OWNER_A);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: OWNER_A_PERSON, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: OWNER_B_PERSON, exact: true })).toHaveCount(0);
});

async function createPerson(page: import("@playwright/test").Page, displayName: string) {
  await page.getByLabel("Name").fill(displayName);
  await page.getByRole("combobox", { name: "Relationship circle" }).selectOption("family");
  await page.getByRole("button", { name: "Save person", exact: true }).click();
}
