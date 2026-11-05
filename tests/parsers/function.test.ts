import { describe, expect, it } from "vite-plus/test";

import { byName, parseFixture, parseInline } from "../helpers/parse.js";

describe("parseFile: function", () => {
  it("extracts exported functions", () => {
    expect(parseFixture().map((chunk) => chunk.name)).toContain("subtract");
  });

  it("cuts the function signature off before the body", () => {
    const subtract = byName(parseFixture(), "subtract");

    expect(subtract.signature).toBe("export function subtract(a: number, b: number): number");
    expect(subtract.content).toContain("return a - b;");
  });

  it("starts at the declaration when there is no JSDoc", () => {
    expect(byName(parseFixture(), "subtract")).toMatchObject({
      startLine: 17,
      endLine: 19,
    });
  });

  it("omits the docComment key when there is no JSDoc", () => {
    expect(byName(parseFixture(), "subtract")).not.toHaveProperty("docComment");
  });

  it("does not extract non-exported functions", () => {
    expect(
      parseInline("function internal() {}\nexport function visible() {}").map(
        (chunk) => chunk.name,
      ),
    ).toEqual(["visible"]);
  });
});
