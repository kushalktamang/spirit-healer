import { describe, expect, it } from "vite-plus/test";

import { isSourceFile } from "../../src/collectors/isSourceFile.js";

describe("isSourceFile", () => {
  it.each([
    ["src/index.ts", true],
    ["src/component.tsx", true],
    ["src/index.js", true],
    ["src/index.jsx", true],
    ["src/index.mjs", true],
    ["src/index.cjs", true],
    ["src/index.mts", true],
    ["src/index.cts", true],

    ["src/index.test.ts", false],
    ["src/index.spec.ts", false],
    ["src/index.d.ts", false],
    ["src/index.d.mts", false],
    ["src/index.d.cts", false],

    ["tests/sample.ts", false],
    ["test/sample.ts", false],
    ["src/__tests__/sample.ts", false],
    ["node_modules/example/index.ts", false],
    ["dist/index.ts", false],
    ["build/index.ts", false],
    ["coverage/index.ts", false],
    [".git/index.ts", false],

    ["src/readme.md", false],
    ["src/data.json", false],
  ])("%s should return %s", (filePath, expected) => {
    expect(isSourceFile(filePath)).toBe(expected);
  });
});
