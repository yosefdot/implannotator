import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { RunRecord } from "../domain/types.js";

export type RejectionChoice = "revise" | "proceed" | "stop";

export async function chooseAfterRejection(ctx: ExtensionContext, run: RunRecord, feedback?: string): Promise<RejectionChoice | "text-required"> {
  if (!ctx.hasUI) return "text-required";
  const choice = await ctx.ui.select(
    "Implannotator review was not approved",
    ["Revise the plan or implementation", "Proceed anyway", "Stop"],
  );
  if (choice === "Proceed anyway") {
    const confirmed = await ctx.ui.confirm(
      "Proceed without approval?",
      `This overrides the mandatory review gate and will be recorded in ${run.id}.${feedback ? `\n\nReview feedback: ${feedback}` : ""}`,
    );
    return confirmed ? "proceed" : "revise";
  }
  if (choice === "Stop" || !choice) return "stop";
  return "revise";
}
