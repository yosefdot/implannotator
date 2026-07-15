import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const packagePath = require.resolve("@plannotator/pi-extension/package.json");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const eventsPath = resolve(dirname(packagePath), "plannotator-events.ts");
const events = readFileSync(eventsPath, "utf8");
const required = [
  '"plannotator:request"',
  '"plannotator:review-result"',
  '| "plan-review"',
  '| "review-status"',
  '| "code-review"',
  "respond: (response:",
];
const missing = required.filter((token) => !events.includes(token));
if (missing.length) {
  console.error(`Plannotator ${pkg.version} is incompatible; missing public contract tokens: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`Plannotator ${pkg.version} public event contract is compatible.`);
