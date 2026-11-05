import { readFileSync } from "node:fs";

import parseFile from "../../src/parsers/parseFile.js";
import type { CodeChunk } from "../../src/types/types.js";

const FIXTURE_PATH = "tests/fixtures/sample.ts";

const fixtureSource = readFileSync(new URL("../fixtures/sample.ts", import.meta.url), "utf8");

const parseFixture = (): CodeChunk[] => parseFile(FIXTURE_PATH, fixtureSource);

// Parse a small inline snippet for edge cases.
const parseInline = (source: string): CodeChunk[] => parseFile("src/inline.ts", source);

// Find a chunk by name, failing with a readable message.
const byName = (chunks: CodeChunk[], name: string): CodeChunk => {
  const chunk = chunks.find((c) => c.name === name);

  if (chunk === undefined) {
    throw new Error(`No chunk named "${name}". Found: ${chunks.map((c) => c.name).join(", ")}`);
  }

  return chunk;
};

export { FIXTURE_PATH, parseFixture, parseInline, byName };
