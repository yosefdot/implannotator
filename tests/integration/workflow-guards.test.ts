import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../extensions/config/defaults.js";
import { Orchestrator } from "../../extensions/workflow/orchestrator.js";

function setup() {
  const cwd = mkdtempSync(join(tmpdir(), "implannotator-guards-"));
  const pi = { events: { emit() {} } } as unknown as ExtensionAPI;
  const ctx = { cwd, hasUI: false } as ExtensionContext;
  return { workflow: new Orchestrator(pi, cwd, DEFAULT_CONFIG), ctx };
}

describe("workflow bypass guards", () => {
  it("blocks final review until initial review exists", async () => {
    const { workflow, ctx } = setup();
    const run = workflow.start("craft", undefined, "medium", "standard").run;
    run.phase = "qa";
    workflow.store.save(run);
    await expect(workflow.review("final", ctx)).rejects.toThrow(/initial review/);
  });

  it("blocks duplicate initial review tabs", async () => {
    const { workflow, ctx } = setup();
    const run = workflow.start("craft", undefined, "medium", "standard").run;
    run.phase = "qa";
    run.reviews.push({ stage: "initial", at: new Date().toISOString(), approved: false });
    workflow.store.save(run);
    await expect(workflow.review("initial", ctx)).rejects.toThrow(/already run/);
  });

  it("requires the exact second-confirmation phrase", () => {
    const { workflow } = setup();
    const run = workflow.start("craft", undefined, "medium", "standard").run;
    run.phase = "awaiting-text-approval";
    run.pendingTextReview = "plan";
    workflow.store.save(run);
    expect(() => workflow.textDecision("plan", "proceed", undefined, true)).toThrow(/exact phrase/);
    expect(workflow.textDecision("plan", "proceed", "confirmed", true, "PROCEED WITHOUT APPROVAL").run.phase).toBe("approved");
  });

  it("resumes only a safe non-mutating phase", () => {
    const { workflow } = setup();
    const run = workflow.start("craft", undefined, "medium", "standard").run;
    run.phase = "implementing";
    workflow.store.save(run);
    expect(workflow.stop().run.phase).toBe("stopped");
    expect(workflow.resume().run.phase).toBe("approved");
  });
});
