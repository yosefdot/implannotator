import type { RunPhase } from "../domain/types.js";

const ALLOWED: Record<RunPhase, readonly RunPhase[]> = {
  inspecting: ["planning", "stopped", "failed"],
  planning: ["awaiting-plan-review", "awaiting-text-approval", "approved", "stopped", "failed"],
  "awaiting-plan-review": ["planning", "approved", "awaiting-text-approval", "stopped", "failed"],
  "awaiting-text-approval": ["planning", "approved", "repairing", "final-review", "complete", "stopped", "failed"],
  approved: ["implementing", "stopped", "failed"],
  implementing: ["qa", "stopped", "failed"],
  qa: ["initial-review", "repairing", "final-review", "stopped", "failed"],
  "initial-review": ["awaiting-text-approval", "repairing", "final-review", "stopped", "failed"],
  repairing: ["qa", "final-review", "stopped", "failed"],
  "final-review": ["awaiting-text-approval", "complete", "repairing", "stopped", "failed"],
  complete: [],
  stopped: [],
  failed: [],
};

export function canTransition(from: RunPhase, to: RunPhase): boolean {
  return ALLOWED[from].includes(to);
}

export function transition(from: RunPhase, to: RunPhase): RunPhase {
  if (!canTransition(from, to)) throw new Error(`Illegal Implannotator transition: ${from} -> ${to}`);
  return to;
}
