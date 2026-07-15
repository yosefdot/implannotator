import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const required = manifest.implannotator?.plannotatorCompanion ?? "unknown";
let developmentVersion;
try {
  developmentVersion = require("@plannotator/pi-extension/package.json").version;
} catch {
  developmentVersion = undefined;
}

try {
  const published = JSON.parse(execFileSync("npm", ["view", "@plannotator/pi-extension", "version", "--json"], { encoding: "utf8" }));
  const latest = Array.isArray(published) ? published.at(-1) : published;
  if (typeof latest !== "string") throw new Error("npm returned no published version.");
  console.log(JSON.stringify({
    companion: "@plannotator/pi-extension",
    required,
    developmentVersion: developmentVersion ?? null,
    latest,
    install: "pi install npm:@plannotator/pi-extension",
  }, null, 2));
} catch (error) {
  console.error(`Could not check npm: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
