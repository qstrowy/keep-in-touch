import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const astroCli = fileURLToPath(new URL("../node_modules/astro/bin/astro.mjs", import.meta.url));
const playwrightCli = fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url));

function stopAstroServer() {
  spawnSync(process.execPath, [astroCli, "dev", "stop"], { stdio: "inherit" });
}

stopAstroServer();

let exitCode = 1;
try {
  const result = spawnSync(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], { stdio: "inherit" });
  exitCode = result.status ?? 1;
} finally {
  stopAstroServer();
}

process.exit(exitCode);
