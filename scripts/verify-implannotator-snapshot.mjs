import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skill = resolve(root, "skills", "implannotator");
const manifest = JSON.parse(readFileSync(resolve(skill, "vendor", "impeccable-manifest.json"), "utf8"));
const failures = [];
for (const entry of manifest.files) {
  const path = resolve(skill, entry.adaptedPath);
  if (!existsSync(path)) { failures.push(`missing ${entry.adaptedPath}`); continue; }
  const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (hash !== entry.adaptedSha256) failures.push(`changed ${entry.adaptedPath}`);
}
const skillText = readFileSync(resolve(skill, "SKILL.md"), "utf8");
for (const required of ["name: implannotator", "implannotator_control", "reference/implannotator-workflow.md", "stage: \"final\""]) {
  if (!skillText.includes(required)) failures.push(`SKILL.md missing ${required}`);
}
if (failures.length) {
  console.error(`Implannotator snapshot verification failed:\n- ${failures.join("\n- ")}\nRun the documented snapshot-update procedure only for intentional changes.`);
  process.exit(1);
}
console.log(`Verified ${manifest.files.length} adapted source files and the mandatory workflow contract.`);
