import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

const EXCLUDED = new Set([".git", ".implannotator", "node_modules", "dist", "build", "coverage", ".next"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function snapshotFiles(cwd: string): Record<string, string> {
  const result: Record<string, string> = {};
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (EXCLUDED.has(entry.name)) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) { visit(path); continue; }
      if (!entry.isFile()) continue;
      const stat = statSync(path);
      if (stat.size > MAX_FILE_BYTES) continue;
      result[relative(cwd, path).replaceAll("\\", "/")] = createHash("sha256").update(readFileSync(path)).digest("hex");
    }
  };
  visit(cwd);
  return result;
}

export function diffSnapshots(before: Record<string, string>, after: Record<string, string>): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((path) => before[path] !== after[path])
    .sort();
}
