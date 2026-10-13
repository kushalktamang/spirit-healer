import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import parseFile from "../src/parsers/index.js";

const filepath = "tests/fixtures/sample.ts";
const source = readFileSync(new URL("fixtures/sample.ts", import.meta.url), "utf8");

describe("parseFile", () => {
  const chunks = parseFile(filepath, source);

  it("extracts exported classes, public methods, and exported functions", () => {
    expect(chunks.map((chunk) => chunk.id)).toEqual([
      `${filepath}::Calculator`,
      `${filepath}::Calculator.add`,
      `${filepath}::subtract`,
    ]);

    expect(chunks.map((chunk) => chunk.kind)).toEqual(["class", "method", "function"]);
  });

  it("does not extract private methods or non-exported functions", () => {
    const names = chunks.map((chunk) => chunk.name);

    expect(names).not.toContain("Calculator.helper");
    expect(names).not.toContain("internalHelper");
  });

  it("preserves method documentation without duplicating JSDoc tags", () => {
    const addChunk = chunks.find((chunk) => chunk.name === "Calculator.add");

    expect(addChunk?.docComment).toContain("@param a first number");
    expect(addChunk?.docComment).toContain("@param b second number");
    expect(addChunk?.docComment).toContain("@returns the sum");

    expect(addChunk?.docComment?.match(/@param a/g)).toHaveLength(1);
  });
});
