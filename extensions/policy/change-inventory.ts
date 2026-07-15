import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { diffSnapshots, snapshotFiles } from "./non-git-diff.js";

export function hasGit(cwd: string): boolean {
  return existsSync(join(cwd, ".git"));
}

export function baselineFiles(cwd: string): Record<string, string> | undefined {
  if (hasGit(cwd)) return undefined;
  try { return snapshotFiles(cwd); } catch { return {}; }
}

export function changedFiles(cwd: string, baseline?: Record<string, string>): string[] {
  if (!hasGit(cwd)) return baseline ? diffSnapshots(baseline, snapshotFiles(cwd)) : [];
  try {
    const output = execFileSync("git", ["status", "--porcelain=v1", "-z"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return output.split("\0").filter(Boolean).map((entry) => entry.slice(3)).filter(Boolean).sort();
  } catch {
    return [];
  }
}
