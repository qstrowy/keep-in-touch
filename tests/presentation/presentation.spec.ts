import { test } from "@playwright/test";
import {
  capturePresentation,
  configurePresentationPage,
  seedPresentation,
} from "../../scripts/presentation-scenario.mjs";

test("presentation people, notes and sample generated topics survive a page reload", async ({ page }) => {
  await configurePresentationPage(page);
  await seedPresentation(page);
  await capturePresentation(page, ".presentation-demo/verified-screenshots");
});
