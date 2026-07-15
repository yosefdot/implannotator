export type PlannotatorAction = "plan-mode" | "plan-review" | "review-status" | "code-review" | "annotate" | "annotate-last" | "archive";

export type PlannotatorResponse<T> =
  | { status: "handled"; result: T }
  | { status: "unavailable"; error?: string }
  | { status: "error"; error: string };

export interface PlanReviewStarted { status: "pending"; reviewId: string }
export type ReviewStatus =
  | { status: "pending" }
  | { status: "missing" }
  | { status: "completed"; reviewId: string; approved: boolean; feedback?: string; savedPath?: string };

export interface CodeReviewResult {
  approved: boolean;
  feedback?: string;
  annotations?: unknown[];
  agentSwitch?: string;
  exit?: boolean;
}
