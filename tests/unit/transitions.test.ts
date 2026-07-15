import { describe, expect, it } from "vitest";
import { canTransition, transition } from "../../extensions/workflow/transitions.js";

describe("workflow transitions", () => {
  it("allows the approval-gated happy path", () => {
    expect(transition("inspecting", "planning")).toBe("planning");
    expect(transition("planning", "awaiting-plan-review")).toBe("awaiting-plan-review");
    expect(transition("awaiting-plan-review", "approved")).toBe("approved");
    expect(transition("approved", "implementing")).toBe("implementing");
  });

  it("rejects mutation before approval and reopening after completion", () => {
    expect(canTransition("planning", "implementing")).toBe(false);
    expect(canTransition("initial-review", "complete")).toBe(false);
    expect(canTransition("stopped", "implementing")).toBe(false);
    expect(canTransition("failed", "qa")).toBe(false);
    expect(() => transition("complete", "repairing")).toThrow(/Illegal/);
  });
});
