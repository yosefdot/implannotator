import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export interface PlannotatorAvailability {
  available: boolean;
  tool: boolean;
  command: boolean;
}

export function getPlannotatorAvailability(pi: ExtensionAPI): PlannotatorAvailability {
  const tool = pi.getAllTools().some((candidate) => candidate.name === "plannotator_submit_plan");
  const command = pi.getCommands().some((candidate) => candidate.name === "plannotator");
  return { available: tool || command, tool, command };
}
