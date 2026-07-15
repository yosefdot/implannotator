import type { RunRecord } from "../domain/types.js";

export function finalReport(run: RunRecord): string {
  const finalReview = [...run.reviews].reverse().find((review) => review.stage === "final");
  return `# Implannotator run ${run.id}\n\n- Status: ${run.phase}\n- Command: ${run.command}${run.target ? ` ${run.target}` : ""}\n- QA profile: ${run.qaProfile}\n- Repairs: ${run.repairCount}/3\n- Changed files: ${run.changedFiles.length}\n- Final review: ${finalReview?.approved ? "approved" : run.completionOverride ? "overridden with warning" : "not approved"}\n- Created: ${run.createdAt}\n- Updated: ${run.updatedAt}\n`;
}
