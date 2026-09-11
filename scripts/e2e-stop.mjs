import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const astroCli = fileURLToPath(new URL("../node_modules/astro/bin/astro.mjs", import.meta.url));
const result = spawnSync(process.execPath, [astroCli, "dev", "stop"], { stdio: "inherit" });

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
