import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerCommands } from "./commands/register.js";
import { loadConfig } from "./config/loader.js";
import { registerMutationGate } from "./policy/mutation-gate.js";
import { getPlannotatorAvailability } from "./plannotator/availability.js";
import { registerControlTool } from "./tools/control-tool.js";
import { Orchestrator } from "./workflow/orchestrator.js";

export default function implannotator(pi: ExtensionAPI): void {
  const workflows = new Map<string, Orchestrator>();
  const getOrchestrator = (cwd: string) => {
    let workflow = workflows.get(cwd);
    if (!workflow) {
      workflow = new Orchestrator(pi, cwd, loadConfig(cwd));
      workflows.set(cwd, workflow);
    }
    return workflow;
  };

  registerControlTool(pi, getOrchestrator);
  registerCommands(pi, getOrchestrator);
  registerMutationGate(pi, (cwd) => getOrchestrator(cwd).active());

  pi.on("session_start", (_event, ctx) => {
    const plannotator = getPlannotatorAvailability(pi);
    if (plannotator.available) {
      ctx.ui.setStatus("implannotator-plannotator", undefined);
    } else {
      ctx.ui.setStatus("implannotator-plannotator", "Implannotator: text approval fallback");
      ctx.ui.notify(
        "Implannotator: Plannotator companion is not active. Install npm:@plannotator/pi-extension for browser reviews; text approval fallback remains available.",
        "warning",
      );
    }

    const run = getOrchestrator(ctx.cwd).active();
    if (run && !["complete", "stopped", "failed"].includes(run.phase)) {
      ctx.ui.setStatus("implannotator", `Implannotator: ${run.phase}`);
      ctx.ui.notify(`Resumable Implannotator run ${run.id} is in ${run.phase}. Use /implannotator resume.`, "info");
    } else {
      ctx.ui.setStatus("implannotator", undefined);
    }
  });
}
