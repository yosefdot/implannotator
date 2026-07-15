import { describe, expect, it } from "vitest";
import { redactText, redactValue } from "../../extensions/state/redaction.js";

describe("audit redaction", () => {
  it("redacts common credentials", () => {
    expect(redactText("api_key=abcdefghijk secret ghp_abcdefghijklmnopqrstuvwxyz")).not.toContain("abcdefghijk");
    expect(redactText("Bearer abcdefghijklmnopqrstuvwxyz")).toContain("Bearer [REDACTED]");
  });

  it("redacts sensitive object keys", () => {
    expect(redactValue({ accessToken: "value", safe: "text" })).toEqual({ accessToken: "[REDACTED]", safe: "text" });
  });
});
