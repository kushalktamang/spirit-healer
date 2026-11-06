import { describe, expect, it } from "vite-plus/test";

import { byName, parseFixture, parseInline } from "../helpers/parse.js";

describe("parseFile: variable", () => {
  it("extracts exported arrow functions", () => {
    const chunks = parseFixture();

    expect(chunks.map((chunk) => chunk.name)).toContain("multiply");
    expect(chunks.map((chunk) => chunk.name)).toContain("divide");

    expect(byName(chunks, "multiply").kind).toBe("function");
    expect(byName(chunks, "divide").kind).toBe("function");
  });

  it("captures arrow function signatures and content", () => {
    const chunks = parseFixture();
    const multiply = byName(chunks, "multiply");
    const divide = byName(chunks, "divide");

    expect(multiply.signature).toContain("multiply =");
    expect(multiply.signature).toContain("=>");
    expect(multiply.content).toContain("a * b");

    expect(divide.signature).toContain("divide =");
    expect(divide.signature).toContain("=>");
    expect(divide.content).toContain("return a / b;");
  });

  it("captures variable JSDoc comments", () => {
    const multiply = byName(parseFixture(), "multiply");

    expect(multiply.docComment).toBe("/** Multiplies two numbers. */");
  });

  it("does not extract constants or non-exported arrow functions", () => {
    const chunks = parseFixture();

    expect(chunks.map((chunk) => chunk.name)).not.toContain("MAX");
    expect(chunks.map((chunk) => chunk.name)).not.toContain("privateFn");
  });

  it("does not extract non-exported arrow functions", () => {
    const chunks = parseInline("const privateFn = () => 1;");

    expect(chunks.map((chunk) => chunk.name)).toEqual([]);
  });

  it("does not extract non-function exported variables", () => {
    const chunks = parseInline("export const MAX = 5;");

    expect(chunks.map((chunk) => chunk.name)).toEqual([]);
  });

  it("extracts multiple arrow functions from one variable statement", () => {
    const chunks = parseInline("export const first = () => 1, second = () => 2;");

    expect(chunks.map((chunk) => chunk.name)).toContain("first");
    expect(chunks.map((chunk) => chunk.name)).toContain("second");
  });

  it("extracts exported function expressions", () => {
    const chunks = parseInline(
      "export const greet = function (name: string): string { return name; };",
    );

    const greet = byName(chunks, "greet");

    expect(greet.kind).toBe("function");
    expect(greet.signature).toContain("function");
    expect(greet.signature).toContain("string");
    expect(greet.content).toContain("return name;");
  });
});
