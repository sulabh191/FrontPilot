import { describe, expect, it } from "vitest";
import { maskPhone } from "./mask";

describe("maskPhone", () => {
  it.each([
    ["+14135550123", "+1••••••0123"], // US, E.164
    ["(413) 555-0123", "••••••0123"], // US, as typed by a customer
    ["+447700900123", "+44••••••0123"], // UK
    ["413-555-0123 ", "••••••0123"], // stray spaces
  ])("masks %s as %s", (input, expected) => {
    expect(maskPhone(input)).toBe(expected);
  });

  it("never reveals more than the last 4 digits of the number", () => {
    const masked = maskPhone("+14135550123");
    expect(masked).not.toContain("413");
    expect(masked).not.toContain("555");
  });

  it("hides very short values completely", () => {
    expect(maskPhone("123")).toBe("•••");
  });

  it("handles a missing phone", () => {
    expect(maskPhone(null)).toBe("(none)");
    expect(maskPhone(undefined)).toBe("(none)");
    expect(maskPhone("")).toBe("(none)");
  });
});
