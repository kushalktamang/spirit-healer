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
      [`tests/fixtures/sample.ts::multiply`, "function"],
      [`tests/fixtures/sample.ts::divide`, "function"],
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

  it("extracts declarations exported in a named export list", () => {
    const source = ["function listed() {}", "export { listed };"].join("\n");

    expect(parseInline(source).map((chunk) => chunk.name)).toEqual(["listed"]);
  });

  it("uses the local declaration name for export aliases", () => {
    const source = ["function localName() {}", "export { localName as publicName };"].join("\n");

    expect(parseInline(source).map((chunk) => chunk.id)).toEqual(["src/inline.ts::localName"]);
  });

  it("extracts a function-valued default export by its local name", () => {
    const source = ["const f = () => 1;", "export default f;"].join("\n");

    expect(parseInline(source).map((chunk) => chunk.name)).toEqual(["f"]);
  });

  it("extracts declarations from type-only export lists", () => {
    const source = ["type T = string;", "export type { T };"].join("\n");

    expect(parseInline(source).map((chunk) => chunk.name)).toEqual(["T"]);
  });

  it("skips re-exports because their declarations are in another file", () => {
    const source = ["function x() {}", 'export { x } from "./y";'].join("\n");

    expect(parseInline(source)).toEqual([]);
  });

  it("skips CommonJS export assignments", () => {
    const source = ["const x = () => 1;", "export = x;"].join("\n");

    expect(parseInline(source)).toEqual([]);
  });

  it("skips default exports without an identifier", () => {
    const source = ["export default () => 1;", "export default { value: 1 };"].join("\n");

    expect(parseInline(source)).toEqual([]);
  });

  it("skips names that are only imported and re-exported", () => {
    const source = ['import { Imported } from "./other";', "export { Imported };"].join("\n");

    expect(parseInline(source)).toEqual([]);
  });

  it("keeps an unlisted declaration private", () => {
    expect(parseInline("function privateFunction() {}\nexport { other };")).toEqual([]);
  });

  it("extracts public methods from a class exported in a list", () => {
    const source = [
      "class Listed {",
      "  run() {}",
      "  private hidden() {}",
      "}",
      "export { Listed };",
    ].join("\n");

    expect(parseInline(source).map((chunk) => chunk.name)).toEqual(["Listed", "Listed.run"]);
  });

  it("skips anonymous default functions and classes", () => {
    const source = ["export default function () {}", "export default class {}"].join("\n");

    expect(parseInline(source)).toEqual([]);
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
