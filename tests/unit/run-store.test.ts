import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RunStore } from "../../extensions/state/run-store.js";

describe("run store", () => {
  it("persists and resumes an active run", () => {
    const cwd = mkdtempSync(join(tmpdir(), "implannotator-"));
    const store = new RunStore(cwd, ".implannotator/runs");
    const run = store.create("craft", "hero", "medium", "standard");
    expect(store.active()?.id).toBe(run.id);
    expect(JSON.parse(readFileSync(join(cwd, ".implannotator", "runs", run.id, "run.json"), "utf8")).phase).toBe("inspecting");
  });
});
