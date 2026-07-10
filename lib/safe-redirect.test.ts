import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("passes through a same-origin path", () => {
    expect(safeRedirectPath("/companies/abc")).toBe("/companies/abc");
  });

  it("falls back when absent", () => {
    expect(safeRedirectPath(undefined)).toBe("/companies");
  });

  it("rejects an absolute URL", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/companies");
  });

  it("rejects a protocol-relative URL", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/companies");
  });

  it("rejects a backslash-smuggled host", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe("/companies");
  });

  it("rejects a scheme without a leading slash", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/companies");
  });
});
