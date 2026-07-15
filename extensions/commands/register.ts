import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { Orchestrator } from "../workflow/orchestrator.js";

const MANAGEMENT = new Set(["status", "resume", "review", "verify", "config", "update-check"]);

export function registerCommands(pi: ExtensionAPI, getOrchestrator: (cwd: string) => Orchestrator): void {
  pi.registerCommand("implannotator", {
    description: "Approval-gated frontend design and implementation: /implannotator [command] [target]",
    handler: async (args, ctx) => handle(args.trim(), pi, ctx, getOrchestrator),
  });
}

async function handle(args: string, pi: ExtensionAPI, ctx: ExtensionCommandContext, getOrchestrator: (cwd: string) => Orchestrator): Promise<void> {
  const [first = "", ...rest] = splitArgs(args);
  const workflow = getOrchestrator(ctx.cwd);
  if (first === "status") {
    const run = workflow.active();
    ctx.ui.notify(run ? `Implannotator ${run.id}: ${run.phase}, repairs ${run.repairCount}/3, QA ${run.qaProfile}` : "No Implannotator run exists here.", "info");
    return;
  }
  if (first === "config") {
    ctx.ui.notify("Config precedence: built-in defaults, ~/.pi/agent/implannotator.json, then <project>/.pi/implannotator.json.", "info");
    return;
  }
  const instruction = !args
    ? "Use the implannotator skill. Inspect this frontend project and recommend the 2-3 highest-value commands, but do not implement until I choose and approve a plan."
    : MANAGEMENT.has(first)
      ? `Use the implannotator skill and ${first}${rest.length ? ` ${rest.join(" ")}` : ""} the active workflow.`
      : `Use the implannotator skill. Start or continue an approval-gated run for command: ${first}${rest.length ? `; target: ${rest.join(" ")}` : ""}.`;
  pi.sendUserMessage(instruction);
}

export function splitArgs(input: string): string[] {
  const result: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|([^\s]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input))) result.push(match[1] ?? match[2] ?? match[3] ?? "");
  return result;
}
