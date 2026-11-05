import { describe, expect, it } from "vite-plus/test";

import { byName, parseFixture, parseInline } from "../helpers/parse.js";

describe("parseFile: enum", () => {
  it("extracts exported enums", () => {
    const chunks = parseFixture();

    expect(chunks.map((chunk) => chunk.name)).toContain("Level");
    expect(byName(chunks, "Level").kind).toBe("enum");
  });

  it("uses the whole declaration as the signature and content", () => {
    const level = byName(parseFixture(), "Level");

    expect(level.signature).toBe(level.content);
    expect(level.content).toContain("Debug = 0");
    expect(level.content).toContain("Info = 1");
  });

  it("captures an enum JSDoc comment", () => {
    expect(byName(parseFixture(), "Level").docComment).toBe("/** Log levels. */");
  });

  it("does not extract non-exported enums", () => {
    expect(parseInline("enum Internal { A }").map((chunk) => chunk.name)).toEqual([]);
  });
});
