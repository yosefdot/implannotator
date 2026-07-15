import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const current = require("@plannotator/pi-extension/package.json").version;
try {
  const published = JSON.parse(execFileSync("npm", ["view", "@plannotator/pi-extension", "version", "--json"], { encoding: "utf8" }));
  const latest = Array.isArray(published) ? published.at(-1) : published;
  if (typeof latest !== "string") throw new Error("npm returned no published version.");
  console.log(JSON.stringify({ dependency: "@plannotator/pi-extension", current, latest, updateAvailable: current !== latest }, null, 2));
} catch (error) {
  console.error(`Could not check npm: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
