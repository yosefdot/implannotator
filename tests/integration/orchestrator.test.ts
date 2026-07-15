import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../extensions/config/defaults.js";
import { Orchestrator } from "../../extensions/workflow/orchestrator.js";

describe("approval workflow", () => {
  it("requires plan approval before implementation", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "implannotator-flow-"));
    const pi = {
      events: {
        emit(_channel: string, request: { action: string; respond: (value: unknown) => void }) {
          if (request.action === "plan-review") request.respond({ status: "handled", result: { status: "pending", reviewId: "r1" } });
          else if (request.action === "review-status") request.respond({ status: "handled", result: { status: "completed", reviewId: "r1", approved: true } });
        },
      },
    } as unknown as ExtensionAPI;
    const ctx = { cwd, hasUI: false } as ExtensionContext;
    const workflow = new Orchestrator(pi, cwd, DEFAULT_CONFIG);
    workflow.start("craft", "hero", "medium", "standard");
    expect(() => workflow.beginImplementation()).toThrow(/blocked/);
    const approved = await workflow.submitPlan("# Plan", ctx);
    expect(approved.run.phase).toBe("approved");
    expect(workflow.beginImplementation().run.phase).toBe("implementing");
  });
});
