import { isAbsolute, relative, resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { RunRecord } from "../domain/types.js";

const TERMINAL = new Set(["complete", "stopped", "failed"]);
const PRE_APPROVAL = new Set(["inspecting", "planning", "awaiting-plan-review", "awaiting-text-approval"]);
const READ_ONLY_BASH = /^\s*(pwd|ls|find|rg|grep|head|tail|wc|stat|file|git\s+(status|diff|log|show|branch)|npm\s+(view|list|ls)|node\s+--version)\b/;
const FORBIDDEN_GIT = /\bgit\s+(commit|stash|reset|clean|push|checkout|switch|restore|rebase|merge)\b/i;

function pathInside(cwd: string, path: string): boolean {
  const rel = relative(resolve(cwd), resolve(cwd, path));
  return !rel.startsWith("..") && !isAbsolute(rel);
}

export function registerMutationGate(pi: ExtensionAPI, activeRun: (cwd: string) => RunRecord | undefined): void {
  pi.on("tool_call", (event, ctx) => {
    const run = activeRun(ctx.cwd);
    if (!run || TERMINAL.has(run.phase) || event.toolName === "implannotator_control") return;

    if (event.toolName === "bash") {
      const command = typeof event.input.command === "string" ? event.input.command : "";
      if (FORBIDDEN_GIT.test(command)) {
        return { block: true, reason: "Implannotator never performs automatic stash/reset/commit/push or other destructive Git operations." };
      }
      if (PRE_APPROVAL.has(run.phase) && !READ_ONLY_BASH.test(command)) {
        return { block: true, reason: `Implannotator approval gate: mutating shell commands are blocked during ${run.phase}.` };
      }
    }

    if ((event.toolName === "write" || event.toolName === "edit") && PRE_APPROVAL.has(run.phase)) {
      return { block: true, reason: `Implannotator approval gate: file mutation is blocked during ${run.phase}. Submit and approve the plan first.` };
    }

    if (event.toolName === "write" || event.toolName === "edit") {
      const input = event.input as Record<string, unknown>;
      const path = typeof input.path === "string" ? input.path : typeof input.file_path === "string" ? input.file_path : undefined;
      if (path && !pathInside(ctx.cwd, path)) return { block: true, reason: "Implannotator blocks writes outside the active project." };
    }
  });
}
