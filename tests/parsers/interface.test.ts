import { describe, expect, it } from "vite-plus/test";

import { byName, parseFixture, parseInline } from "../helpers/parse.js";

describe("parseFile: interface", () => {
  it("extracts exported interfaces", () => {
    expect(parseFixture().map((chunk) => chunk.name)).toContain("Options");
  });

  it("uses the whole declaration as the signature and content", () => {
    const options = byName(parseFixture(), "Options");

    expect(options.signature).toBe(options.content);
    expect(options.content).toContain("retries: number");
  });

  it("captures a single-line JSDoc comment", () => {
    expect(byName(parseFixture(), "Options").docComment).toBe("/** Client options. */");
  });

  it("starts a chunk at its JSDoc", () => {
    expect(byName(parseFixture(), "Options")).toMatchObject({
      startLine: 25,
      endLine: 28,
    });
  });

  it("does not extract non-exported interfaces", () => {
    expect(parseInline("interface Internal { value: string }").map((chunk) => chunk.name)).toEqual(
      [],
    );
  });
});
