export const PHASES = [
  "inspecting",
  "planning",
  "awaiting-plan-review",
  "awaiting-text-approval",
  "approved",
  "implementing",
  "qa",
  "initial-review",
  "repairing",
  "final-review",
  "complete",
  "stopped",
  "failed",
] as const;

export type RunPhase = (typeof PHASES)[number];
export type QaProfile = "quick" | "standard" | "full";
export type RiskLevel = "low" | "medium" | "high";
export type ReviewStage = "plan" | "initial" | "final";
export type EvidenceStatus = "passed" | "failed" | "unavailable" | "not-applicable";

export interface ImplannotatorConfig {
  schemaVersion: 1;
  approval: {
    required: true;
    allowLowRiskAutoApprove: boolean;
    proceedRequiresSecondConfirmation: true;
    browserTimeoutMs: number;
  };
  repairs: { maxAttempts: number; reopenOnlyForFinalReview: true };
  qa: { defaultProfile: "adaptive" | QaProfile; requireEvidence: boolean };
  audit: { directory: string; retentionDays: number; redactSensitiveValues: boolean };
  git: { allowAutomaticCommit: false; allowAutomaticStash: false; preserveExistingChanges: true };
  subagents: { enabled: boolean; readOnly: true; mainAgentSoleWriter: true };
}

export interface DecisionRecord {
  at: string;
  kind: string;
  actor: "user" | "agent" | "system";
  decision: string;
  reason?: string;
  warned?: boolean;
}

export interface QaCheck {
  id: string;
  label: string;
  status: EvidenceStatus;
  evidence?: string[];
  notes?: string;
}

export interface QaReport {
  schemaVersion: 1;
  profile: QaProfile;
  createdAt: string;
  checks: QaCheck[];
  blockingFailures: string[];
}

export interface ReviewRecord {
  stage: ReviewStage;
  at: string;
  approved: boolean;
  feedback?: string;
  annotations?: unknown[];
  fallback?: "text";
}

export interface RunRecord {
  schemaVersion: 1;
  id: string;
  cwd: string;
  command: string;
  target?: string;
  risk: RiskLevel;
  phase: RunPhase;
  resumePhase?: Exclude<RunPhase, "complete" | "stopped" | "failed" | "implementing" | "repairing">;
  createdAt: string;
  updatedAt: string;
  plan?: string;
  planReviewId?: string;
  pendingTextReview?: ReviewStage;
  repairCount: number;
  qaProfile: QaProfile;
  changedFiles: string[];
  baselineFiles?: Record<string, string>;
  decisions: DecisionRecord[];
  reviews: ReviewRecord[];
  lastError?: string;
  completionOverride?: boolean;
}
