import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { DecisionRecord, QaReport, ReviewRecord, RunRecord } from "../domain/types.js";
import { atomicWrite, atomicWriteJson } from "./atomic-file.js";
import { redactText, redactValue } from "./redaction.js";
import { runLayout } from "./run-layout.js";

export class RunStore {
  readonly auditRoot: string;
  readonly activePointer: string;

  constructor(readonly cwd: string, readonly auditDirectory: string) {
    this.auditRoot = resolve(cwd, auditDirectory);
    this.activePointer = join(dirname(this.auditRoot), "active-run");
  }

  create(command: string, target: string | undefined, risk: RunRecord["risk"], qaProfile: RunRecord["qaProfile"]): RunRecord {
    const now = new Date().toISOString();
    const id = `${now.replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
    const run: RunRecord = {
      schemaVersion: 1,
      id,
      cwd: this.cwd,
      command,
      ...(target ? { target } : {}),
      risk,
      phase: "inspecting",
      createdAt: now,
      updatedAt: now,
      repairCount: 0,
      qaProfile,
      changedFiles: [],
      decisions: [],
      reviews: [],
    };
    this.save(run);
    atomicWrite(this.activePointer, `${id}\n`);
    return run;
  }

  save(run: RunRecord): void {
    run.updatedAt = new Date().toISOString();
    const layout = runLayout(this.cwd, this.auditDirectory, run.id);
    mkdirSync(layout.root, { recursive: true, mode: 0o700 });
    atomicWriteJson(layout.runJson, redactValue(run));
    atomicWriteJson(layout.changedFiles, run.changedFiles);
    if (run.plan !== undefined) {
      const plan = redactText(run.plan);
      atomicWrite(layout.plan, plan.endsWith("\n") ? plan : `${plan}\n`);
    }
  }

  load(id: string): RunRecord {
    const path = runLayout(this.cwd, this.auditDirectory, id).runJson;
    const run = JSON.parse(readFileSync(path, "utf8")) as RunRecord;
    if (run.schemaVersion !== 1 || run.cwd !== this.cwd) throw new Error("Unsupported or misplaced run record.");
    return run;
  }

  active(): RunRecord | undefined {
    if (!existsSync(this.activePointer)) return undefined;
    const id = readFileSync(this.activePointer, "utf8").trim();
    if (!id) return undefined;
    try { return this.load(basename(id)); } catch { return undefined; }
  }

  appendDecision(run: RunRecord, decision: DecisionRecord): void {
    run.decisions.push(decision);
    const layout = runLayout(this.cwd, this.auditDirectory, run.id);
    mkdirSync(dirname(layout.decisions), { recursive: true, mode: 0o700 });
    appendFileSync(layout.decisions, `${JSON.stringify(redactValue(decision))}\n`, { encoding: "utf8", mode: 0o600 });
    this.save(run);
  }

  saveQa(run: RunRecord, report: QaReport): void {
    atomicWriteJson(runLayout(this.cwd, this.auditDirectory, run.id).qaReport, redactValue(report));
  }

  saveReview(run: RunRecord, review: ReviewRecord): void {
    run.reviews.push(review);
    const path = join(runLayout(this.cwd, this.auditDirectory, run.id).reviews, `${review.stage}-${run.reviews.length}.json`);
    atomicWriteJson(path, redactValue(review));
    this.save(run);
  }

  saveRepair(run: RunRecord, summary: string): void {
    const path = join(runLayout(this.cwd, this.auditDirectory, run.id).repairs, `${run.repairCount}.md`);
    const redacted = redactText(summary);
    atomicWrite(path, redacted.endsWith("\n") ? redacted : `${redacted}\n`);
  }

  saveFinalReport(run: RunRecord, report: string): void {
    const redacted = redactText(report);
    atomicWrite(runLayout(this.cwd, this.auditDirectory, run.id).finalReport, redacted.endsWith("\n") ? redacted : `${redacted}\n`);
  }
}
