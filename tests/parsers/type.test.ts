import { describe, expect, it } from "vite-plus/test";

import { byName, parseFixture, parseInline } from "../helpers/parse.js";

describe("parseFile: type", () => {
  it("extracts exported type aliases", () => {
    expect(parseFixture().map((chunk) => chunk.name)).toContain("Mode");
  });

  it("uses the whole declaration as the signature and content", () => {
    const mode = byName(parseFixture(), "Mode");

    expect(mode.signature).toBe(mode.content);
    expect(mode.content).toBe('export type Mode = "fast" | "safe";');
  });

  it("starts at the declaration when there is no JSDoc", () => {
    expect(byName(parseFixture(), "Mode")).toMatchObject({
      startLine: 30,
      endLine: 30,
    });
  });

  it("omits the docComment key when there is no JSDoc", () => {
    expect(byName(parseFixture(), "Mode")).not.toHaveProperty("docComment");
  });

  it("does not extract non-exported type aliases", () => {
    expect(parseInline("type Internal = string;").map((chunk) => chunk.name)).toEqual([]);
  });
});
