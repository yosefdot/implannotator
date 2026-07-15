import { describe, expect, it } from "vitest";
import { classifyRisk, selectQaProfile } from "../../extensions/qa/classifier.js";
import { requiredChecks } from "../../extensions/qa/checklist.js";

describe("adaptive QA", () => {
  it("selects conservative profiles", () => {
    expect(selectQaProfile({ changedFileCount: 1 })).toBe("quick");
    expect(selectQaProfile({ changedFileCount: 4 })).toBe("standard");
    expect(selectQaProfile({ changedFileCount: 1, newPage: true })).toBe("full");
    expect(classifyRisk({ changedFileCount: 1, authOrPayments: true })).toBe("high");
  });

  it("adds checks monotonically", () => {
    expect(requiredChecks("standard").length).toBeGreaterThan(requiredChecks("quick").length);
    expect(requiredChecks("full")).toContain("performance-core-web-vitals");
  });
});
