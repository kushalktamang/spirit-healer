import path from "node:path";

const SKIP_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  "tests",
  "__tests__",
  "test",
]);

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"]);

const isSourceFile = (filePath: string): boolean => {
  const normalizedPath = filePath.replaceAll("\\", "/");
  const segments = normalizedPath.split("/");
  const filename = segments.at(-1) ?? "";

  // Skip test files.
  if (/\.(?<testType>test|spec)\.[^.]+$/u.test(filename)) {
    return false;
  }

  // Skip TypeScript declaration files.
  if (/\.d\.(?<extension>ts|mts|cts)$/u.test(filename)) {
    return false;
  }

  // Skip these directory names at any depth intentionally; legitimate source directories with
  // names such as "test" or "build" are therefore excluded as well.
  if (segments.some((segment) => SKIP_DIRECTORIES.has(segment))) {
    return false;
  }

  return SOURCE_EXTENSIONS.has(path.extname(filename));
};

export { SKIP_DIRECTORIES, isSourceFile };
