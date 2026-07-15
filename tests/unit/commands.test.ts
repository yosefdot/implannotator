import { describe, expect, it } from "vitest";
import { splitArgs } from "../../extensions/commands/register.js";

describe("command parser", () => {
  it("supports quotes and Unicode", () => {
    expect(splitArgs('craft "pricing hero" café')).toEqual(["craft", "pricing hero", "café"]);
  });

  it("handles empty input", () => {
    expect(splitArgs("")).toEqual([]);
  });
});
