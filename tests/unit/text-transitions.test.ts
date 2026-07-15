import { describe, expect, it } from "vitest";
import { canTransition } from "../../extensions/workflow/transitions.js";

describe("text fallback transitions", () => {
  it("supports plan and code-review decisions", () => {
    expect(canTransition("awaiting-text-approval", "approved")).toBe(true);
    expect(canTransition("awaiting-text-approval", "repairing")).toBe(true);
    expect(canTransition("awaiting-text-approval", "final-review")).toBe(true);
    expect(canTransition("awaiting-text-approval", "complete")).toBe(true);
  });
});
