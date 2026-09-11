import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const astroCli = fileURLToPath(new URL("../node_modules/astro/bin/astro.mjs", import.meta.url));
spawnSync(process.execPath, [astroCli, "dev", "stop"], { stdio: "ignore" });
const server = spawn(process.execPath, [astroCli, "dev", "--host", "127.0.0.1", "--port", "4322"], {
  env: { ...process.env, KEEP_IN_TOUCH_E2E: "1" },
  stdio: "inherit",
});

function stopServer() {
  if (!server.killed) server.kill();
  spawnSync(process.execPath, [astroCli, "dev", "stop"], { stdio: "inherit" });
  process.exit(0);
}

process.on("SIGINT", () => {
  stopServer();
});
process.on("SIGTERM", () => {
  stopServer();
});

server.on("exit", (code, signal) => {
  if (code !== 0) process.exit(code ?? (signal ? 1 : 0));
});

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:4322/auth/signin");
      if (response.ok) return;
    } catch {
      // Keep polling while Astro and the Cloudflare runtime finish starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.error("The e2e server did not become reachable within 30 seconds.");
  stopServer();
}

await waitForServer();

function keepServerAlive() {
  return undefined;
}

setInterval(keepServerAlive, 60_000);
