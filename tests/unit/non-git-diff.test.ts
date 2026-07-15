import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { diffSnapshots, snapshotFiles } from "../../extensions/policy/non-git-diff.js";

describe("non-Git change inventory", () => {
  it("detects added and modified files", () => {
    const cwd = mkdtempSync(join(tmpdir(), "implannotator-inventory-"));
    writeFileSync(join(cwd, "a.txt"), "before");
    const before = snapshotFiles(cwd);
    writeFileSync(join(cwd, "a.txt"), "after");
    writeFileSync(join(cwd, "b.txt"), "new");
    expect(diffSnapshots(before, snapshotFiles(cwd))).toEqual(["a.txt", "b.txt"]);
  });
});
