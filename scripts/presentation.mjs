import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import {
  capturePresentation,
  configurePresentationPage,
  DEMO_ORIGIN,
  demoPeople,
  seedPresentation,
} from "./presentation-scenario.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const artifacts = fileURLToPath(new URL("../.presentation-demo/", import.meta.url));
const demoViewport = { width: 1600, height: 900 };
await mkdir(artifacts, { recursive: true });

async function serverReady() {
  try {
    const response = await fetch(`${DEMO_ORIGIN}/dashboard`, {
      headers: { "x-keep-in-touch-e2e-owner": "owner-a" },
      redirect: "manual",
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

if (!(await serverReady())) {
  const server = spawn(process.execPath, ["scripts/e2e-server.mjs"], {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (server.exitCode !== null) throw new Error("Presentation server exited before startup.");
    if (await serverReady()) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) {
    server.kill();
    throw new Error("The local synthetic-session server did not become ready.");
  }
  server.unref();
}

const context = await chromium.launchPersistentContext(`${artifacts}/profile`, {
  channel: "msedge",
  headless: false,
  viewport: demoViewport,
  args: ["--window-size=1632,1000"],
  serviceWorkers: "block",
});
const page = context.pages()[0] ?? (await context.newPage());
await configurePresentationPage(page);
try {
  await page.goto(`${DEMO_ORIGIN}/dashboard`);
  await page.getByRole("heading", { name: "Your people", exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Add person", exact: true })
    .or(page.getByRole("button", { name: "Save person", exact: true }))
    .waitFor();
  const savedProfiles = await Promise.all(
    demoPeople.map((person) => page.getByRole("button", { name: new RegExp(person.name) }).count()),
  );
  if (savedProfiles.every((count) => count === 1)) {
    console.log("Reusing the saved presentation data.");
  } else {
    await seedPresentation(page);
  }
  await capturePresentation(page, `${artifacts}/screenshots`);
  await page.setViewportSize(demoViewport);
  await page.screenshot({ path: `${artifacts}/screenshots/06-wide-16x9.png` });
  console.log(`\nDemo ready at ${DEMO_ORIGIN}/dashboard in the dedicated Edge window.`);
  console.log("5 fictional people, 13 notes, 15 curated sample AI topics. No live model calls.");
  console.log(`Screenshots: ${artifacts}/screenshots`);
  console.log("Keep this process running while using the demo. Close the demo browser to finish.");
  await new Promise((resolve) => context.once("close", resolve));
} catch (error) {
  await page.screenshot({ path: `${artifacts}/error.png`, fullPage: true }).catch(() => undefined);
  await context.close();
  throw error;
}
