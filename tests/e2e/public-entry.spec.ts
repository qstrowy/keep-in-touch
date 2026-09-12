import { expect, test } from "@playwright/test";

test("lets a signed-out visitor start the email sign-in journey", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "KeepInTouch", exact: true })).toBeVisible();
  await expect(page.getByText("A private place for the people you want to keep in touch with.")).toBeVisible();

  await page.getByRole("link", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/auth\/signin$/);
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "KeepInTouch", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
});

test("keeps the dashboard and extraction endpoint private for signed-out visitors", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/signin$/);

  const status = await page.evaluate(async () => {
    const response = await fetch("/api/extractions/anchors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "A valid signed-out extraction request.", excludedTopics: [] }),
    });

    return response.status;
  });

  expect(status).toBe(401);
});
