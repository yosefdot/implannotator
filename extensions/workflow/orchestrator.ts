import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { ImplannotatorConfig, QaProfile, QaReport, ReviewRecord, ReviewStage, RiskLevel, RunRecord } from "../domain/types.js";
import { baselineFiles, changedFiles } from "../policy/change-inventory.js";
import { PlannotatorClient } from "../plannotator/client.js";
import { finalReport } from "../review/final-report.js";
import { RunStore } from "../state/run-store.js";
import { chooseAfterRejection } from "./approval-policy.js";
import { transition } from "./transitions.js";

export interface WorkflowResult {
  run: RunRecord;
  message: string;
  needsTextDecision?: boolean;
}

function now(): string { return new Date().toISOString(); }

const SAFE_RESUME_PHASES = new Set<RunRecord["phase"]>([
  "inspecting", "planning", "awaiting-plan-review", "awaiting-text-approval", "approved", "qa", "initial-review", "final-review",
]);

export class Orchestrator {
  readonly store: RunStore;
  readonly client: PlannotatorClient;

  constructor(readonly pi: ExtensionAPI, readonly cwd: string, readonly config: ImplannotatorConfig) {
    this.store = new RunStore(cwd, config.audit.directory);
    this.client = new PlannotatorClient(pi);
  }

  active(): RunRecord | undefined { return this.store.active(); }

  start(command: string, target: string | undefined, risk: RiskLevel, qaProfile: QaProfile): WorkflowResult {
    const existing = this.active();
    if (existing && !["complete", "stopped", "failed"].includes(existing.phase)) {
      throw new Error(`Run ${existing.id} is already active in phase ${existing.phase}. Resume or stop it first.`);
    }
    const run = this.store.create(command, target, risk, qaProfile);
    const baseline = baselineFiles(this.cwd);
    if (baseline) run.baselineFiles = baseline;
    this.store.appendDecision(run, { at: now(), kind: "run", actor: "user", decision: "started", reason: `${command}${target ? ` ${target}` : ""}` });
    return { run, message: `Run ${run.id} started. Inspect the project without editing, then submit a complete plan.` };
  }

  async submitPlan(plan: string, ctx: ExtensionContext, signal?: AbortSignal): Promise<WorkflowResult> {
    const run = this.requireActive();
    if (run.phase === "inspecting") run.phase = transition(run.phase, "planning");
    if (run.phase !== "planning") throw new Error(`Cannot submit a plan during ${run.phase}.`);
    run.plan = plan;

    if (this.config.approval.allowLowRiskAutoApprove && run.risk === "low" && !ctx.hasUI) {
      run.phase = transition(run.phase, "approved");
      this.store.appendDecision(run, { at: now(), kind: "plan", actor: "system", decision: "auto-approved", reason: "Explicit low-risk fallback setting enabled." });
      return { run, message: "Plan auto-approved by explicit low-risk fallback configuration. Begin implementation." };
    }

    run.phase = transition(run.phase, "awaiting-plan-review");
    this.store.save(run);
    const response = await this.client.startPlanReview(plan, signal);
    if (response.status === "handled") {
      run.planReviewId = response.result.reviewId;
      this.store.save(run);
      const result = await this.client.waitForPlanDecision(response.result.reviewId, this.config.approval.browserTimeoutMs, signal);
      if (result.status === "completed") {
        if (result.approved) {
          run.phase = transition(run.phase, "approved");
          this.store.appendDecision(run, { at: now(), kind: "plan", actor: "user", decision: "approved", ...(result.feedback ? { reason: result.feedback } : {}) });
          return { run, message: "Plan approved in Plannotator. Begin implementation." };
        }
        return this.handlePlanRejection(run, ctx, result.feedback);
      }
      run.phase = transition(run.phase, "awaiting-text-approval");
      run.pendingTextReview = "plan";
      this.store.save(run);
      return { run, message: "The browser review could not be recovered. Ask the user to approve, revise, or stop in chat.", needsTextDecision: true };
    }
    return this.textPlanFallback(run, ctx, response.error);
  }

  private async textPlanFallback(run: RunRecord, ctx: ExtensionContext, reason?: string): Promise<WorkflowResult> {
    if (ctx.hasUI) {
      const edited = await ctx.ui.editor("Implannotator text plan review", run.plan ?? "");
      if (edited !== undefined && edited.trim() && edited !== run.plan) run.plan = edited;
      const choice = await ctx.ui.select("Approve implementation plan?", ["Approve", "Revise", "Stop"]);
      if (choice === "Approve") {
        run.phase = transition(run.phase, "approved");
        this.store.appendDecision(run, { at: now(), kind: "plan", actor: "user", decision: "approved-text-fallback", ...(reason ? { reason } : {}) });
        return { run, message: "Plan approved through text fallback. Begin implementation." };
      }
      if (choice === "Revise") {
        run.phase = transition(run.phase, "planning");
        this.store.appendDecision(run, { at: now(), kind: "plan", actor: "user", decision: "revise", ...(reason ? { reason } : {}) });
        return { run, message: "Revise the plan and submit it again." };
      }
      run.phase = transition(run.phase, "awaiting-text-approval");
      run.pendingTextReview = "plan";
      this.pause(run);
      this.store.appendDecision(run, { at: now(), kind: "run", actor: "user", decision: "stopped", ...(reason ? { reason } : {}) });
      return { run, message: "Run stopped." };
    }
    run.phase = transition(run.phase, "awaiting-text-approval");
    run.pendingTextReview = "plan";
    this.store.save(run);
    return { run, message: `Browser review unavailable${reason ? `: ${reason}` : ""}. Present the plan in chat and ask the user to approve, revise, proceed with warning, or stop.`, needsTextDecision: true };
  }

  private async handlePlanRejection(run: RunRecord, ctx: ExtensionContext, feedback?: string): Promise<WorkflowResult> {
    const choice = await chooseAfterRejection(ctx, run, feedback);
    if (choice === "text-required") {
      run.phase = transition(run.phase, "awaiting-text-approval");
      run.pendingTextReview = "plan";
      this.store.save(run);
      return { run, message: `Plan was not approved${feedback ? `: ${feedback}` : ""}. Ask the user to revise, proceed anyway, or stop.`, needsTextDecision: true };
    }
    if (choice === "proceed") {
      run.phase = transition(run.phase, "approved");
      run.completionOverride = true;
      this.store.appendDecision(run, { at: now(), kind: "plan", actor: "user", decision: "proceed-anyway", reason: feedback ?? "Plan review rejected or closed.", warned: true });
      return { run, message: "Approval override recorded. Begin implementation." };
    }
    if (choice === "revise") {
      run.phase = transition(run.phase, "planning");
      this.store.appendDecision(run, { at: now(), kind: "plan", actor: "user", decision: "revise", ...(feedback ? { reason: feedback } : {}) });
      return { run, message: `Revise and resubmit the plan${feedback ? ` using this feedback: ${feedback}` : "."}` };
    }
    run.phase = transition(run.phase, "awaiting-text-approval");
    run.pendingTextReview = "plan";
    this.pause(run);
    this.store.appendDecision(run, { at: now(), kind: "run", actor: "user", decision: "stopped-after-plan-review" });
    return { run, message: "Run stopped." };
  }

  textDecision(stage: ReviewStage, decision: "approve" | "revise" | "proceed" | "stop", reason?: string, warned = false, confirmation?: string): WorkflowResult {
    const run = this.requireActive();
    if (run.phase !== "awaiting-text-approval" || run.pendingTextReview !== stage) throw new Error(`No ${stage} text decision is pending.`);
    if (decision === "proceed" && (!warned || confirmation !== "PROCEED WITHOUT APPROVAL")) {
      throw new Error('Proceed requires a second explicit confirmation with the exact phrase "PROCEED WITHOUT APPROVAL".');
    }
    if (stage !== "plan") {
      this.store.saveReview(run, { stage, at: now(), approved: decision === "approve", fallback: "text", ...(reason ? { feedback: reason } : {}) });
    }
    if (decision === "stop") {
      this.pause(run);
    } else {
      delete run.pendingTextReview;
      if (stage === "plan") run.phase = transition(run.phase, decision === "revise" ? "planning" : "approved");
      else if (decision === "revise") run.phase = transition(run.phase, "repairing");
      else run.phase = transition(run.phase, stage === "final" ? "complete" : "final-review");
    }
    if (decision === "proceed") run.completionOverride = true;
    this.store.appendDecision(run, { at: now(), kind: `${stage}-review`, actor: "user", decision, ...(reason ? { reason } : {}), ...(decision === "proceed" ? { warned: true } : {}) });
    if (run.phase === "complete") this.finish(run);
    return { run, message: `Recorded ${stage} decision: ${decision}. Current phase: ${run.phase}.` };
  }

  beginImplementation(): WorkflowResult {
    const run = this.requireActive();
    if (run.phase !== "approved") throw new Error(`Implementation is blocked during ${run.phase}.`);
    run.phase = transition(run.phase, "implementing");
    this.store.appendDecision(run, { at: now(), kind: "implementation", actor: "agent", decision: "started" });
    return { run, message: "Implementation gate opened. Preserve unrelated work and do not commit, stash, reset, or push." };
  }

  recordQa(report: QaReport): WorkflowResult {
    const run = this.requireActive();
    if (run.phase === "implementing" || run.phase === "repairing") run.phase = transition(run.phase, "qa");
    if (run.phase !== "qa") throw new Error(`Cannot record QA during ${run.phase}.`);
    if (report.profile !== run.qaProfile) throw new Error(`QA profile mismatch: expected ${run.qaProfile}.`);
    this.store.saveQa(run, report);
    run.changedFiles = changedFiles(this.cwd, run.baselineFiles);
    if (report.blockingFailures.length > 0) run.phase = transition(run.phase, "repairing");
    this.store.save(run);
    const hasInitialReview = run.reviews.some((review) => review.stage === "initial");
    return { run, message: report.blockingFailures.length ? `QA found ${report.blockingFailures.length} blocking failure(s). Repair without opening a review tab.` : hasInitialReview ? "QA passed after initial review. Open the one final review tab." : "QA passed. Open the required initial code review." };
  }

  recordRepair(summary: string): WorkflowResult {
    const run = this.requireActive();
    if (run.phase !== "repairing") throw new Error(`Cannot record a repair during ${run.phase}.`);
    if (run.repairCount >= this.config.repairs.maxAttempts) throw new Error("The maximum of three repair attempts has been reached.");
    run.repairCount += 1;
    this.store.saveRepair(run, summary);
    run.phase = transition(run.phase, "qa");
    this.store.appendDecision(run, { at: now(), kind: "repair", actor: "agent", decision: `completed-${run.repairCount}`, reason: summary.slice(0, 500) });
    return { run, message: `Repair ${run.repairCount}/${this.config.repairs.maxAttempts} recorded. Re-run QA; do not open an intermediate browser review.` };
  }

  async review(stage: Exclude<ReviewStage, "plan">, ctx: ExtensionContext, signal?: AbortSignal): Promise<WorkflowResult> {
    const run = this.requireActive();
    const hasInitialReview = run.reviews.some((review) => review.stage === "initial");
    if (stage === "initial" && run.phase !== "qa") throw new Error(`Initial review requires QA phase, not ${run.phase}.`);
    if (stage === "initial" && hasInitialReview) throw new Error("The initial review has already run; intermediate repair tabs are forbidden. Run the final review after QA.");
    if (stage === "final" && !hasInitialReview) throw new Error("Final review is blocked until the required initial review has completed.");
    if (stage === "final" && !["qa", "initial-review", "final-review"].includes(run.phase)) throw new Error(`Final review cannot start during ${run.phase}.`);
    run.phase = stage === "initial" ? transition(run.phase, "initial-review") : (run.phase === "final-review" ? run.phase : transition(run.phase, "final-review"));
    this.store.save(run);
    const response = await this.client.codeReview(this.cwd, signal);
    if (response.status !== "handled") {
      run.phase = transition(run.phase, "awaiting-text-approval");
      run.pendingTextReview = stage;
      this.store.save(run);
      return { run, message: `Plannotator ${stage} review unavailable${response.error ? `: ${response.error}` : ""}. Present the diff and QA evidence in chat, then record approve, revise, proceed, or stop.`, needsTextDecision: true };
    }
    const review: ReviewRecord = { stage, at: now(), approved: response.result.approved, ...(response.result.feedback ? { feedback: response.result.feedback } : {}), ...(response.result.annotations ? { annotations: response.result.annotations } : {}) };
    this.store.saveReview(run, review);
    if (review.approved) {
      if (stage === "initial") {
        run.phase = transition(run.phase, "final-review");
        this.store.save(run);
        return { run, message: "Initial review approved. Open the one final review tab now; no intermediate repair tab is needed." };
      }
      run.phase = transition(run.phase, "complete");
      this.finish(run);
      return { run, message: "Final review approved. Run complete." };
    }
    const choice = await chooseAfterRejection(ctx, run, review.feedback);
    if (choice === "proceed") {
      run.completionOverride = true;
      run.phase = stage === "final" ? transition(run.phase, "complete") : transition(run.phase, "final-review");
      this.store.appendDecision(run, { at: now(), kind: `${stage}-review`, actor: "user", decision: "proceed-anyway", reason: review.feedback ?? "Review rejected or closed.", warned: true });
      if (run.phase === "complete") this.finish(run);
      return { run, message: `Review override recorded. Current phase: ${run.phase}.` };
    }
    if (choice === "stop") {
      run.phase = transition(run.phase, "awaiting-text-approval");
      run.pendingTextReview = stage;
      this.pause(run);
      this.store.appendDecision(run, { at: now(), kind: "run", actor: "user", decision: `stopped-after-${stage}-review` });
      return { run, message: "Run stopped." };
    }
    if (choice === "text-required") {
      run.phase = transition(run.phase, "awaiting-text-approval");
      run.pendingTextReview = stage;
      this.store.save(run);
      return { run, message: `Review not approved${review.feedback ? `: ${review.feedback}` : ""}. Ask whether to revise, proceed with warning, or stop.`, needsTextDecision: true };
    }
    if (run.repairCount >= this.config.repairs.maxAttempts) {
      run.phase = transition(run.phase, "awaiting-text-approval");
      run.pendingTextReview = stage;
      this.store.save(run);
      return { run, message: "Review remains unapproved after three repairs. Ask the user to proceed with warning or stop.", needsTextDecision: true };
    }
    run.phase = transition(run.phase, "repairing");
    this.store.appendDecision(run, { at: now(), kind: `${stage}-review`, actor: "user", decision: "revise", ...(review.feedback ? { reason: review.feedback } : {}) });
    return { run, message: `Repair review findings without opening a new browser tab. Feedback: ${review.feedback ?? "See annotations."}` };
  }

  stop(reason?: string): WorkflowResult {
    const run = this.requireActive();
    if (!["complete", "stopped"].includes(run.phase)) this.pause(run);
    this.store.appendDecision(run, { at: now(), kind: "run", actor: "user", decision: "stopped", ...(reason ? { reason } : {}) });
    return { run, message: "Run stopped and preserved for resume." };
  }

  resume(): WorkflowResult {
    const run = this.requireActive();
    if (run.phase === "stopped") {
      const resumePhase = run.resumePhase as RunRecord["phase"] | undefined;
      if (!resumePhase || !SAFE_RESUME_PHASES.has(resumePhase)) {
        throw new Error("Stopped run has no safe non-mutating resume phase.");
      }
      run.phase = resumePhase;
      delete run.resumePhase;
      this.store.appendDecision(run, { at: now(), kind: "run", actor: "user", decision: "resumed", reason: `Resumed at safe phase ${run.phase}.` });
    }
    if (run.phase === "failed") throw new Error("Failed runs require an explicit new plan; they cannot resume directly into mutation.");
    return { run, message: `Resume run ${run.id} from ${run.phase}. Read its audit record before acting.` };
  }

  private pause(run: RunRecord): void {
    if (["complete", "stopped", "failed"].includes(run.phase)) return;
    const resumePhase = run.phase === "implementing" ? "approved" : run.phase === "repairing" ? "qa" : run.phase;
    if (resumePhase === "complete" || resumePhase === "stopped" || resumePhase === "failed") throw new Error("Cannot pause a terminal run.");
    run.resumePhase = resumePhase;
    run.phase = transition(run.phase, "stopped");
    this.store.save(run);
  }

  private finish(run: RunRecord): void {
    run.changedFiles = changedFiles(this.cwd, run.baselineFiles);
    this.store.save(run);
    this.store.saveFinalReport(run, finalReport(run));
  }

  private requireActive(): RunRecord {
    const run = this.active();
    if (!run) throw new Error("No Implannotator run exists in this project.");
    return run;
  }
}
