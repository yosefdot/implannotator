import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vitest";
import { getPlannotatorAvailability } from "../../extensions/plannotator/availability.js";

function fakePi(tools: string[], commands: string[]): ExtensionAPI {
  return {
    getAllTools: () => tools.map((name) => ({ name })),
    getCommands: () => commands.map((name) => ({ name, invocationName: name })),
  } as unknown as ExtensionAPI;
}

describe("Plannotator companion detection", () => {
  it("detects the companion by its public tool", () => {
    expect(getPlannotatorAvailability(fakePi(["plannotator_submit_plan"], [])).available).toBe(true);
  });

  it("detects the companion by its public command", () => {
    expect(getPlannotatorAvailability(fakePi([], ["plannotator"])).available).toBe(true);
  });

  it("uses fallback when the companion is absent", () => {
    expect(getPlannotatorAvailability(fakePi([], []))).toEqual({ available: false, tool: false, command: false });
  });
});
