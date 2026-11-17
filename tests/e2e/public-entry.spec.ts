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

test("keeps the opening composition proportionate on a 4K display", async ({ page }) => {
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto("/");
  const composition = page.locator("[data-prologue-stage]");
  const prologue = page.locator("[data-prologue]");
  const olive = page.locator('[data-note="1"]');
  const noteBefore = await olive.evaluate((element) => getComputedStyle(element).width);
  const opening = await composition.boundingBox();
  if (!opening) throw new Error("Composition is missing");
  expect(opening.width).toBeGreaterThan(2500);
  expect(opening.width).toBeLessThanOrEqual(3840);
  const man = await page.locator('[data-layer="man"]').boundingBox();
  const woman = await page.locator('[data-layer="woman"]').boundingBox();
  if (!man || !woman) throw new Error("Entrance layers are missing");
  expect(man.x + man.width).toBeLessThan(0);
  expect(woman.x).toBeGreaterThan(3840);
  const notes = await page.locator("[data-note]").evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right };
    }),
  );
  for (const note of notes) {
    expect(note.left).toBeGreaterThanOrEqual(0);
    expect(note.right).toBeLessThanOrEqual(3840);
  }
  await prologue.evaluate((element) => {
    window.scrollTo(
      0,
      element.getBoundingClientRect().top + window.scrollY + element.clientHeight - window.innerHeight,
    );
  });
  await expect(page.locator('[data-layer="original"]')).toHaveCSS("opacity", "1");
  await expect(olive).toHaveCSS("width", noteBefore);
  const scene = await page.locator('[data-layer="original"]').boundingBox();
  if (!scene) throw new Error("Scene is missing");
  expect(scene.width).toBeGreaterThan(800);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(3840);
});

test("keeps the complete scene visible with reduced motion at 4K", async ({ page }) => {
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const stage = await page.locator(".kit-prologue-stage").boundingBox();
  const scene = await page.locator('[data-layer="original"]').boundingBox();
  if (!stage || !scene) throw new Error("Scene is missing");
  expect(scene.y + scene.height).toBeLessThanOrEqual(stage.y + stage.height);
  await expect(page.locator('[data-layer="original"]')).toHaveCSS("opacity", "1");
});

test("keeps the scene solid while the final illustration fades in", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-prologue]").evaluate((element) => {
    const travel = element.clientHeight - window.innerHeight;
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + travel * 0.93);
  });
  const original = page.locator('[data-layer="original"]');
  await expect
    .poll(async () => Number(await original.evaluate((element) => getComputedStyle(element).opacity)))
    .toBeGreaterThan(0);
  await expect(page.locator('[data-layer="man"]')).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-layer="woman"]')).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-layer="table"]')).toHaveCSS("opacity", "1");
  await expect(original).toHaveCSS("z-index", "4");
});
