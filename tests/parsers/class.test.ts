import { describe, expect, it } from "vite-plus/test";

import { parseFixture, byName, parseInline } from "../helpers/parse.js";

describe("parseFile: class", () => {
  it("extract exported class", () => {
    const chunks = parseFixture();

    expect(chunks.map((c) => c.name)).toContain("Calculator");
  });

  it("keeps method bodies out of the class chunk", () => {
    const calculator = byName(parseFixture(), "Calculator");

    expect(calculator.signature).toBe("export class Calculator");
    expect(calculator.content).not.toContain("return a + b;");
  });

  it("extracts public methods", () => {
    const chunks = parseFixture();

    expect(chunks.map((c) => c.name)).toContain("Calculator.add");
  });

  it("excludes private, protected and #private methods", () => {
    const source = [
      "export class Service {",
      "  run() {}",
      "  private secret() {}",
      "  protected inner() {}",
      "  #hidden() {}",
      "}",
    ].join("\n");

    expect(parseInline(source).map((c) => c.name)).toEqual(["Service", "Service.run"]);
  });

  it("handles an empty exported class", () => {
    const chunks = parseInline("export class Empty {}");

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      name: "Empty",
      kind: "class",
      signature: "export class Empty",
    });
  });

  it("extracts method signature and body", () => {
    const add = byName(parseFixture(), "Calculator.add");

    expect(add.signature).toBe("add(a: number, b: number): number");
    expect(add.content).toContain("return a + b;");
  });

  it("captures method JSDoc exactly once", () => {
    const add = byName(parseFixture(), "Calculator.add");

    expect(add.docComment).toContain("Adds two numbers.");
    expect(add.docComment).toContain("@param b second number");
    expect(add.docComment).toContain("@returns the sum");
    expect(add.docComment?.match(/@param a/g)).toHaveLength(1);
  });

  it("starts a method at its JSDoc and a class at its declaration", () => {
    const chunks = parseFixture();

    expect(byName(chunks, "Calculator")).toMatchObject({
      startLine: 1,
      endLine: 15,
    });
    expect(byName(chunks, "Calculator.add")).toMatchObject({
      startLine: 2,
      endLine: 10,
    });
  });
});
