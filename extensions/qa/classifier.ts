import type { QaProfile, RiskLevel } from "../domain/types.js";

export interface QaScope {
  changedFileCount: number;
  sharedComponents?: boolean;
  navigation?: boolean;
  newPage?: boolean;
  redesign?: boolean;
  authOrPayments?: boolean;
}

export function classifyRisk(scope: QaScope): RiskLevel {
  if (scope.authOrPayments || scope.navigation || scope.redesign) return "high";
  if (scope.newPage || scope.sharedComponents || scope.changedFileCount > 3) return "medium";
  return "low";
}

export function selectQaProfile(scope: QaScope): QaProfile {
  const risk = classifyRisk(scope);
  if (risk === "high" || scope.newPage || scope.redesign) return "full";
  if (risk === "medium" || scope.changedFileCount > 1) return "standard";
  return "quick";
}
