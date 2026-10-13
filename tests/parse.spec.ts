import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import parseFile from "../src/parsers/index.js";
import type { CodeChunk } from "../src/types/types.js";

const FIXTURE_PATH = "tests/fixtures/sample.ts";
const fixtureSource = readFileSync(
  new URL("./fixtures/sample.ts", import.meta.url),
  "utf8",
);

/** Parse a small inline snippet. Use this for edge cases instead of growing the fixture. */
const parseInline = (source: string): CodeChunk[] =>
  parseFile("src/inline.ts", source);

/** Find a chunk by name, failing with a readable message instead of returning undefined. */
const byName = (chunks: CodeChunk[], name: string): CodeChunk => {
  const chunk = chunks.find((c) => c.name === name);
  if (!chunk) {
    throw new Error(
      `No chunk named "${name}". Found: ${chunks.map((c) => c.name).join(", ")}`,
    );
  }
  return chunk;
};

describe("parseFile: sample.ts fixture", () => {
  let chunks: CodeChunk[];

  // Parsing inside beforeAll means a parser crash fails the tests, not test collection.
  beforeAll(() => {
    chunks = parseFile(FIXTURE_PATH, fixtureSource);
  });

  it("extracts every exported declaration, in source order", () => {
    expect(chunks.map((c) => [c.id, c.kind])).toEqual([
      [`${FIXTURE_PATH}::Calculator`, "class"],
      [`${FIXTURE_PATH}::Calculator.add`, "method"],
      [`${FIXTURE_PATH}::subtract`, "function"],
      [`${FIXTURE_PATH}::Options`, "interface"],
      [`${FIXTURE_PATH}::Mode`, "type"],
    ]);
  });

  it("skips private methods and non-exported declarations", () => {
    const names = chunks.map((c) => c.name);

    expect(names).not.toContain("Calculator.helper");
    expect(names).not.toContain("internalHelper");
    expect(names).not.toContain("Hidden");
  });

  it("builds every id as `${filepath}::${name}`", () => {
    for (const chunk of chunks) {
      expect(chunk.id).toBe(`${chunk.filepath}::${chunk.name}`);
      expect(chunk.filepath).toBe(FIXTURE_PATH);
    }
  });

  describe("signatures and content", () => {
    it("cuts a function signature off before the body", () => {
      const subtract = byName(chunks, "subtract");

      expect(subtract.signature).toBe(
        "export function subtract(a: number, b: number): number",
      );
      expect(subtract.content).toContain("return a - b;");
    });

    it("keeps method bodies out of the class chunk", () => {
      const calculator = byName(chunks, "Calculator");

      expect(calculator.signature).toBe("export class Calculator");
      expect(calculator.content).not.toContain("return a + b;");
    });

    it("gives a method its own signature and body", () => {
      const add = byName(chunks, "Calculator.add");

      expect(add.signature).toBe("add(a: number, b: number): number");
      expect(add.content).toContain("return a + b;");
    });

    it("uses the whole declaration as the signature for interfaces and type aliases", () => {
      const options = byName(chunks, "Options");
      const mode = byName(chunks, "Mode");

      expect(options.signature).toBe(options.content);
      expect(options.content).toContain("retries: number");

      expect(mode.signature).toBe(mode.content);
      expect(mode.content).toBe('export type Mode = "fast" | "safe";');
    });
  });

  describe("line numbers (1-based, inclusive)", () => {
    it("starts a chunk at its JSDoc when it has one", () => {
      expect(byName(chunks, "Calculator.add")).toMatchObject({
        startLine: 2,
        endLine: 10,
      });
      expect(byName(chunks, "Options")).toMatchObject({
        startLine: 25,
        endLine: 28,
      });
    });

    it("starts a chunk at the declaration when there is no JSDoc", () => {
      expect(byName(chunks, "Calculator")).toMatchObject({
        startLine: 1,
        endLine: 15,
      });
      expect(byName(chunks, "subtract")).toMatchObject({
        startLine: 17,
        endLine: 19,
      });
      expect(byName(chunks, "Mode")).toMatchObject({
        startLine: 30,
        endLine: 30,
      });
    });

    it("never ends before it starts", () => {
      for (const chunk of chunks) {
        expect(chunk.endLine).toBeGreaterThanOrEqual(chunk.startLine);
      }
    });
  });

  describe("doc comments", () => {
    it("keeps JSDoc tags exactly once", () => {
      const docComment = byName(chunks, "Calculator.add").docComment;

      expect(docComment).toContain("Adds two numbers.");
      expect(docComment).toContain("@param a first number");
      expect(docComment).toContain("@param b second number");
      expect(docComment).toContain("@returns the sum");
      expect(docComment?.match(/@param a/g)).toHaveLength(1);
    });

    it("captures a single-line JSDoc on an interface", () => {
      expect(byName(chunks, "Options").docComment).toBe("/** Client options. */");
    });

    it("omits the docComment key entirely when there is no JSDoc", () => {
      // exactOptionalPropertyTypes: absent is not the same as `undefined`.
      expect(byName(chunks, "subtract")).not.toHaveProperty("docComment");
      expect(byName(chunks, "Mode")).not.toHaveProperty("docComment");
    });
  });
});

describe("parseFile: edge cases", () => {
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

  it("excludes private, protected and #private methods but keeps public ones", () => {
    const source = [
      "export class Service {",
      "  run() {}",
      "  private secret() {}",
      "  protected inner() {}",
      "  #hidden() {}",
      "}",
    ].join("\n");

    expect(parseInline(source).map((c) => c.name)).toEqual([
      "Service",
      "Service.run",
    ]);
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

  it("uses 1-based line numbers", () => {
    const [chunk] = parseInline("export function f() {}");

    expect(chunk).toMatchObject({ startLine: 1, endLine: 1 });
  });

  it("keeps ids stable when unrelated code is added above", () => {
    const before = parseInline("export function add() {}");
    const after = parseInline(
      "export function multiply() {}\nexport function add() {}",
    );

    const addBefore = byName(before, "add");
    const addAfter = byName(after, "add");

    // Same identity across both parses...
    expect(addAfter.id).toBe(addBefore.id);
    // ...even though its position moved.
    expect(addAfter.startLine).toBeGreaterThan(addBefore.startLine);
  });
});

// Not implemented yet. Each one becomes a real test when you build the feature.
describe("parseFile: planned", () => {
  it.todo("extracts exported enums");
  it.todo("extracts exported arrow functions (`export const f = () => ...`)");
  it.todo("decides what to do with `export const MAX = 5`");
  it.todo("handles duplicate ids from declaration merging");
  it.todo("handles `export { name }` re-exports and `export default`");
});