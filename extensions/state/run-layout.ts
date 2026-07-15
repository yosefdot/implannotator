import { isAbsolute, relative, resolve } from "node:path";

export interface RunLayout {
  root: string;
  runJson: string;
  plan: string;
  decisions: string;
  changedFiles: string;
  qaReport: string;
  reviews: string;
  repairs: string;
  evidence: string;
  finalReport: string;
}

export function assertInside(parent: string, child: string): string {
  const resolvedParent = resolve(parent);
  const resolvedChild = resolve(child);
  const rel = relative(resolvedParent, resolvedChild);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error(`Path escapes audit root: ${child}`);
  return resolvedChild;
}

export function runLayout(cwd: string, auditDirectory: string, id: string): RunLayout {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Invalid run id.");
  const auditRoot = assertInside(cwd, resolve(cwd, auditDirectory));
  const root = assertInside(auditRoot, resolve(auditRoot, id));
  return {
    root,
    runJson: resolve(root, "run.json"),
    plan: resolve(root, "plan.md"),
    decisions: resolve(root, "decisions.ndjson"),
    changedFiles: resolve(root, "changed-files.json"),
    qaReport: resolve(root, "qa", "report.json"),
    reviews: resolve(root, "reviews"),
    repairs: resolve(root, "repairs"),
    evidence: resolve(root, "evidence"),
    finalReport: resolve(root, "final-report.md"),
  };
}
