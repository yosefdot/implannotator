import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const skill = resolve(root, "skills", "implannotator");

describe("packed skill integrity", () => {
  it("contains the workflow and every command reference", () => {
    const text = readFileSync(resolve(skill, "SKILL.md"), "utf8");
    expect(text).toContain("name: implannotator");
    for (const command of ["craft", "shape", "audit", "polish", "live", "critique", "document", "optimize"]) {
      expect(existsSync(resolve(skill, "reference", `${command}.md`))).toBe(true);
    }
    expect(text).toContain("implannotator_control");
  });
});
