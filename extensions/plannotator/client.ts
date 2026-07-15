import { randomUUID } from "node:crypto";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { CodeReviewResult, PlanReviewStarted, PlannotatorAction, PlannotatorResponse, ReviewStatus } from "./contracts.js";

const REQUEST_CHANNEL = "plannotator:request";

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason ?? new Error("Aborted")); }, { once: true });
  });
}

export class PlannotatorClient {
  constructor(private readonly pi: ExtensionAPI, private readonly responseTimeoutMs = 5_000) {}

  request<T>(action: PlannotatorAction, payload: Record<string, unknown>, signal?: AbortSignal): Promise<PlannotatorResponse<T>> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (response: PlannotatorResponse<T>) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(response);
      };
      const timer = setTimeout(() => finish({ status: "unavailable", error: `Plannotator did not handle ${action} within ${this.responseTimeoutMs}ms.` }), this.responseTimeoutMs);
      signal?.addEventListener("abort", () => finish({ status: "error", error: "Plannotator request aborted." }), { once: true });
      this.pi.events.emit(REQUEST_CHANNEL, { requestId: randomUUID(), action, payload, respond: finish });
    });
  }

  async startPlanReview(planContent: string, signal?: AbortSignal): Promise<PlannotatorResponse<PlanReviewStarted>> {
    return this.request("plan-review", { planContent, origin: "implannotator" }, signal);
  }

  async reviewStatus(reviewId: string, signal?: AbortSignal): Promise<PlannotatorResponse<ReviewStatus>> {
    return this.request("review-status", { reviewId }, signal);
  }

  async waitForPlanDecision(reviewId: string, timeoutMs: number, signal?: AbortSignal): Promise<ReviewStatus> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const response = await this.reviewStatus(reviewId, signal);
      if (response.status !== "handled") throw new Error(response.error ?? "Plannotator review status unavailable.");
      if (response.result.status !== "pending") return response.result;
      await delay(500, signal);
    }
    throw new Error("Timed out waiting for plan approval.");
  }

  async codeReview(cwd: string, signal?: AbortSignal): Promise<PlannotatorResponse<CodeReviewResult>> {
    return this.request("code-review", { cwd, diffType: "uncommitted", useLocal: true }, signal);
  }
}
