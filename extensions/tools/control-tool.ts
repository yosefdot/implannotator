import { Type } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { QaReport, QaProfile, ReviewStage, RiskLevel } from "../domain/types.js";
import type { Orchestrator } from "../workflow/orchestrator.js";

const Parameters = Type.Object({
  action: Type.Union([
    Type.Literal("start"), Type.Literal("status"), Type.Literal("submit_plan"), Type.Literal("text_decision"),
    Type.Literal("begin_implementation"), Type.Literal("record_qa"), Type.Literal("record_repair"),
    Type.Literal("review"), Type.Literal("resume"), Type.Literal("stop"),
  ]),
  command: Type.Optional(Type.String()),
  target: Type.Optional(Type.String()),
  risk: Type.Optional(Type.Union([Type.Literal("low"), Type.Literal("medium"), Type.Literal("high")])),
  qaProfile: Type.Optional(Type.Union([Type.Literal("quick"), Type.Literal("standard"), Type.Literal("full")])),
  plan: Type.Optional(Type.String()),
  reportJson: Type.Optional(Type.String()),
  summary: Type.Optional(Type.String()),
  stage: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("initial"), Type.Literal("final")])),
  decision: Type.Optional(Type.Union([Type.Literal("approve"), Type.Literal("revise"), Type.Literal("proceed"), Type.Literal("stop")])),
  reason: Type.Optional(Type.String()),
  warned: Type.Optional(Type.Boolean()),
  confirmation: Type.Optional(Type.String()),
});

export function registerControlTool(pi: ExtensionAPI, getOrchestrator: (cwd: string) => Orchestrator): void {
  pi.registerTool({
    name: "implannotator_control",
    label: "Implannotator",
    description: "Control the approval-gated Implannotator frontend workflow. Start a run, submit a plan, open reviews, record QA/repairs, resume, or stop.",
    promptSnippet: "Use implannotator_control at every Implannotator phase boundary.",
    promptGuidelines: [
      "Never begin file mutation until submit_plan returns an approved phase and begin_implementation succeeds.",
      "Record complete QA evidence before review; never open browser review during intermediate repairs.",
    ],
    parameters: Parameters,
    executionMode: "sequential",
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      try {
        const workflow = getOrchestrator(ctx.cwd);
        let result;
        switch (params.action) {
          case "start":
            result = workflow.start(params.command ?? "craft", params.target, (params.risk ?? "medium") as RiskLevel, (params.qaProfile ?? "standard") as QaProfile);
            break;
          case "status": {
            const run = workflow.active();
            if (!run) return output("No Implannotator run exists in this project.", undefined);
            result = { run, message: `Run ${run.id}: ${run.phase}; repairs ${run.repairCount}/3; QA ${run.qaProfile}.` };
            break;
          }
          case "submit_plan":
            if (!params.plan?.trim()) throw new Error("submit_plan requires plan.");
            result = await workflow.submitPlan(params.plan, ctx, signal);
            break;
          case "text_decision":
            if (!params.stage || !params.decision) throw new Error("text_decision requires stage and decision.");
            result = workflow.textDecision(params.stage as ReviewStage, params.decision, params.reason, params.warned ?? false, params.confirmation);
            break;
          case "begin_implementation":
            result = workflow.beginImplementation();
            break;
          case "record_qa": {
            if (!params.reportJson) throw new Error("record_qa requires reportJson.");
            let report: QaReport;
            try { report = JSON.parse(params.reportJson) as QaReport; } catch { throw new Error("reportJson must be valid JSON."); }
            result = workflow.recordQa(report);
            break;
          }
          case "record_repair":
            if (!params.summary?.trim()) throw new Error("record_repair requires summary.");
            result = workflow.recordRepair(params.summary);
            break;
          case "review":
            if (params.stage !== "initial" && params.stage !== "final") throw new Error("review stage must be initial or final.");
            result = await workflow.review(params.stage, ctx, signal);
            break;
          case "resume":
            result = workflow.resume();
            break;
          case "stop":
            result = workflow.stop(params.reason);
            break;
        }
        return output(result.message, result.run);
      } catch (error) {
        return { content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }], details: { ok: false }, isError: true };
      }
    },
  });
}

function output(message: string, run: unknown) {
  return { content: [{ type: "text" as const, text: message }], details: { ok: true, run } };
}
