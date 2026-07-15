import type { ImplannotatorConfig } from "../domain/types.js";

export const DEFAULT_CONFIG: ImplannotatorConfig = {
  schemaVersion: 1,
  approval: {
    required: true,
    allowLowRiskAutoApprove: false,
    proceedRequiresSecondConfirmation: true,
    browserTimeoutMs: 30 * 60 * 1000,
  },
  repairs: { maxAttempts: 3, reopenOnlyForFinalReview: true },
  qa: { defaultProfile: "adaptive", requireEvidence: true },
  audit: { directory: ".implannotator/runs", retentionDays: 90, redactSensitiveValues: true },
  git: { allowAutomaticCommit: false, allowAutomaticStash: false, preserveExistingChanges: true },
  subagents: { enabled: true, readOnly: true, mainAgentSoleWriter: true },
};
