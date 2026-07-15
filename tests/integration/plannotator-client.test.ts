import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vitest";
import { PlannotatorClient } from "../../extensions/plannotator/client.js";

describe("Plannotator public event adapter", () => {
  it("uses the documented request/respond contract", async () => {
    const pi = {
      events: {
        emit(_channel: string, request: { action: string; respond: (value: unknown) => void }) {
          expect(request.action).toBe("plan-review");
          request.respond({ status: "handled", result: { status: "pending", reviewId: "review-1" } });
        },
      },
    } as unknown as ExtensionAPI;
    const client = new PlannotatorClient(pi, 50);
    await expect(client.startPlanReview("# Plan")).resolves.toEqual({ status: "handled", result: { status: "pending", reviewId: "review-1" } });
  });

  it("reports unavailable listeners", async () => {
    const pi = { events: { emit() {} } } as unknown as ExtensionAPI;
    const client = new PlannotatorClient(pi, 5);
    await expect(client.startPlanReview("# Plan")).resolves.toMatchObject({ status: "unavailable" });
  });
});
