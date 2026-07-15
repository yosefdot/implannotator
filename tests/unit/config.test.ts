import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../extensions/config/defaults.js";
import { validateConfig } from "../../extensions/config/loader.js";

describe("configuration safety", () => {
  it("uses strict safe defaults", () => {
    expect(DEFAULT_CONFIG.approval.required).toBe(true);
    expect(DEFAULT_CONFIG.approval.allowLowRiskAutoApprove).toBe(false);
    expect(DEFAULT_CONFIG.repairs.maxAttempts).toBe(3);
    expect(DEFAULT_CONFIG.git.allowAutomaticCommit).toBe(false);
  });

  it("rejects weakened safety settings", () => {
    expect(() => validateConfig({ ...DEFAULT_CONFIG, repairs: { ...DEFAULT_CONFIG.repairs, maxAttempts: 4 } })).toThrow(/0 through 3/);
    expect(() => validateConfig({ ...DEFAULT_CONFIG, git: { ...DEFAULT_CONFIG.git, allowAutomaticCommit: true as false } })).toThrow(/Unsafe Git/);
  });
});
