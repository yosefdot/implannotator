import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

describe("Pi package manifest", () => {
  it("loads only the Implannotator extension", () => {
    expect(manifest.version).toBe("0.1.1");
    expect(manifest.pi.extensions).toEqual(["extensions/index.ts"]);
    expect(manifest.pi.skills).toEqual(["skills/implannotator"]);
  });

  it("does not ship or register a second Plannotator extension", () => {
    expect(manifest.dependencies?.["@plannotator/pi-extension"]).toBeUndefined();
    expect(manifest.bundledDependencies).toBeUndefined();
    expect(manifest.implannotator.plannotatorCompanion).toBe("^0.23.1");
  });
});
