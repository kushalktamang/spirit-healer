import ts from "typescript";
import { describe, expect, it } from "vite-plus/test";

import { collectExportedNames } from "../../src/parsers/helpers.js";

const collectNames = (source: string): string[] => {
  const sourceFile = ts.createSourceFile("inline.ts", source, ts.ScriptTarget.ES2022, true);

  return [...collectExportedNames(sourceFile)];
};

describe("collectExportedNames", () => {
  it.each([
    ["export { a, b };", ["a", "b"]],
    ["export { a as publicA };", ["a"]],
    ["export type { T };", ["T"]],
    ["const f = () => 1; export default f;", ["f"]],
    ['export { x } from "./other.js";', []],
  ])("collects local names from %s", (source, expected) => {
    expect(collectNames(source)).toEqual(expected);
  });
});
