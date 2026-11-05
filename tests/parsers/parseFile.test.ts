import { describe, expect, it } from "vite-plus/test";

import { FIXTURE_PATH, byName, parseFixture, parseInline } from "../helpers/parse.js";

describe("parseFile", () => {
  it("extracts every exported declaration in source order", () => {
    const chunks = parseFixture();

    expect(chunks.map((chunk) => [chunk.id, chunk.kind])).toEqual([
      [`${FIXTURE_PATH}::Calculator`, "class"],
      [`${FIXTURE_PATH}::Calculator.add`, "method"],
      [`${FIXTURE_PATH}::subtract`, "function"],
      [`${FIXTURE_PATH}::Options`, "interface"],
      [`${FIXTURE_PATH}::Mode`, "type"],
      [`${FIXTURE_PATH}::Level`, "enum"],
    ]);
  });

  it("skips private methods and non-exported declarations", () => {
    const names = parseFixture().map((chunk) => chunk.name);

    expect(names).not.toContain("Calculator.helper");
    expect(names).not.toContain("internalHelper");
    expect(names).not.toContain("Hidden");
    expect(names).not.toContain("Internal");
  });

  it("builds every id as `${filepath}::${name}`", () => {
    for (const chunk of parseFixture()) {
      expect(chunk.id).toBe(`${chunk.filepath}::${chunk.name}`);
      expect(chunk.filepath).toBe(FIXTURE_PATH);
    }
  });

  it("returns no chunks when nothing is exported", () => {
    const source = [
      "function a() {}",
      "class B {}",
      "interface C { x: number }",
      "type D = string;",
    ].join("\n");

    expect(parseInline(source)).toEqual([]);
  });

  it("returns no chunks for an empty file", () => {
    expect(parseInline("")).toEqual([]);
  });

  it("uses 1-based line numbers", () => {
    const [chunk] = parseInline("export function f() {}");

    expect(chunk).toMatchObject({ startLine: 1, endLine: 1 });
  });

  it("never ends a chunk before it starts", () => {
    for (const chunk of parseFixture()) {
      expect(chunk.endLine).toBeGreaterThanOrEqual(chunk.startLine);
    }
  });

  it("keeps ids stable when unrelated code is added above", () => {
    const before = parseInline("export function add() {}");
    const after = parseInline("export function multiply() {}\nexport function add() {}");

    const addBefore = byName(before, "add");
    const addAfter = byName(after, "add");

    expect(addAfter.id).toBe(addBefore.id);
    expect(addAfter.startLine).toBeGreaterThan(addBefore.startLine);
  });
});
