import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { DEFAULT_CONFIG } from "./defaults.js";
import type { ImplannotatorConfig } from "../domain/types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function merge<T>(base: T, override: unknown): T {
  if (!isRecord(base) || !isRecord(override)) return (override === undefined ? base : override) as T;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = isRecord(value) && isRecord(result[key]) ? merge(result[key], value) : value;
  }
  return result as T;
}

function readJson(path: string): unknown {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Invalid Implannotator configuration at ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const CONFIG_KEYS: Record<string, readonly string[]> = {
  root: ["schemaVersion", "approval", "repairs", "qa", "audit", "git", "subagents"],
  approval: ["required", "allowLowRiskAutoApprove", "proceedRequiresSecondConfirmation", "browserTimeoutMs"],
  repairs: ["maxAttempts", "reopenOnlyForFinalReview"],
  qa: ["defaultProfile", "requireEvidence"],
  audit: ["directory", "retentionDays", "redactSensitiveValues"],
  git: ["allowAutomaticCommit", "allowAutomaticStash", "preserveExistingChanges"],
  subagents: ["enabled", "readOnly", "mainAgentSoleWriter"],
};

function assertKnownConfig(value: unknown, source: string): void {
  if (value === undefined) return;
  if (!isRecord(value)) throw new Error(`Implannotator configuration at ${source} must be an object.`);
  for (const key of Object.keys(value)) {
    if (!CONFIG_KEYS.root!.includes(key)) throw new Error(`Unknown Implannotator setting ${key} in ${source}.`);
    if (key !== "schemaVersion" && value[key] !== undefined) {
      if (!isRecord(value[key])) throw new Error(`Implannotator setting ${key} in ${source} must be an object.`);
      for (const nested of Object.keys(value[key])) {
        if (!CONFIG_KEYS[key]!.includes(nested)) throw new Error(`Unknown Implannotator setting ${key}.${nested} in ${source}.`);
      }
    }
  }
}

export function validateConfig(config: ImplannotatorConfig): ImplannotatorConfig {
  if (config.schemaVersion !== 1) throw new Error("Unsupported Implannotator config schemaVersion.");
  if (config.approval.required !== true) throw new Error("approval.required cannot be disabled.");
  if (config.approval.proceedRequiresSecondConfirmation !== true) throw new Error("Proceed confirmation cannot be disabled.");
  if (!Number.isInteger(config.approval.browserTimeoutMs) || config.approval.browserTimeoutMs < 1_000) throw new Error("approval.browserTimeoutMs must be at least 1000.");
  if (!Number.isInteger(config.repairs.maxAttempts) || config.repairs.maxAttempts < 0 || config.repairs.maxAttempts > 3) {
    throw new Error("repairs.maxAttempts must be an integer from 0 through 3.");
  }
  if (config.repairs.reopenOnlyForFinalReview !== true) throw new Error("Intermediate repair review tabs cannot be enabled.");
  if (!['adaptive', 'quick', 'standard', 'full'].includes(config.qa.defaultProfile)) throw new Error("qa.defaultProfile is invalid.");
  if (isAbsolute(config.audit.directory) || config.audit.directory.split(/[\\/]+/).includes("..")) throw new Error("audit.directory must stay inside the project.");
  if (!Number.isInteger(config.audit.retentionDays) || config.audit.retentionDays < 1) throw new Error("audit.retentionDays must be a positive integer.");
  if (!config.audit.redactSensitiveValues) throw new Error("Audit redaction cannot be disabled.");
  if (config.git.allowAutomaticCommit || config.git.allowAutomaticStash || !config.git.preserveExistingChanges) {
    throw new Error("Unsafe Git automation settings are not supported.");
  }
  if (!config.subagents.readOnly || !config.subagents.mainAgentSoleWriter) {
    throw new Error("Subagents must remain read-only and the main agent must be the sole writer.");
  }
  return config;
}

export function loadConfig(cwd: string): ImplannotatorConfig {
  const globalPath = join(homedir(), ".pi", "agent", "implannotator.json");
  const projectPath = join(cwd, ".pi", "implannotator.json");
  const globalConfig = readJson(globalPath);
  const projectConfig = readJson(projectPath);
  assertKnownConfig(globalConfig, globalPath);
  assertKnownConfig(projectConfig, projectPath);
  const config = merge(merge(DEFAULT_CONFIG, globalConfig), projectConfig);
  return validateConfig(config);
}
