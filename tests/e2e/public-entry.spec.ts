import { expect, test } from "@playwright/test";

test("lets a signed-out visitor start the email sign-in journey", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "The little things are the big things.", exact: true })).toBeVisible();
  await expect(page.getByText(/You remember\s*the person\./)).toBeVisible();

  await page.getByRole("link", { name: "Start remembering", exact: true }).first().click();
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

test("resolves the opening scene while keeping Olive's note width stable", async ({ page }) => {
  await page.goto("/");
  const prologue = page.locator("[data-prologue]");
  const olive = page.locator('[data-note="1"]');
  const initialWidth = await olive.evaluate((element) => getComputedStyle(element).width);
  const stage = await page.locator("[data-prologue-stage]").boundingBox();
  const man = await page.locator('[data-layer="man"]').boundingBox();
  const woman = await page.locator('[data-layer="woman"]').boundingBox();
  const table = await page.locator('[data-layer="table"]').boundingBox();
  if (!stage || !man || !woman || !table) throw new Error("Scene elements are missing");
  expect(man.x + man.width).toBeLessThan(stage.x);
  expect(woman.x).toBeGreaterThan(stage.x + stage.width);
  expect(table.y).toBeGreaterThan(stage.y + stage.height);
  await prologue.evaluate((element) => {
    window.scrollTo(
      0,
      element.getBoundingClientRect().top + window.scrollY + element.clientHeight - window.innerHeight,
    );
  });
  await expect(page.locator('[data-layer="original"]')).toHaveCSS("opacity", "1");
  await expect(olive).toHaveCSS("width", initialWidth);
  await expect(page.locator('[data-note="3"]')).not.toHaveCSS("opacity", "0");
});

test("shows the completed scene immediately for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator('[data-layer="original"]')).toHaveCSS("opacity", "1");
  await expect(page.locator("#hero-title")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-prologue]")).not.toHaveClass(/is-animated/);
});
