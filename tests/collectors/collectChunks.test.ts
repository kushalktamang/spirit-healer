import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vite-plus/test";

import collectChunks from "../../src/collectors/collectChunks.js";
import walkSourceFiles from "../../src/collectors/walkSourceFiles.js";

const temporaryRoots: string[] = [];

const createTemporaryRoot = async (): Promise<string> => {
  const root = await mkdtemp(path.join(os.tmpdir(), "spirit-healer-"));

  temporaryRoots.push(root);
  return root;
};

const writeSource = async (root: string, relativePath: string, source: string): Promise<void> => {
  const absolutePath = path.join(root, ...relativePath.split("/"));

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, source, "utf8");
};

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("collectChunks", () => {
  it("collects only source files and uses relative forward-slash IDs", async () => {
    const root = await createTemporaryRoot();

    await writeSource(root, "src/a.ts", "export interface A {}\n");
    await writeSource(root, "src/nested/b.ts", "export function b() {}\n");
    await writeSource(root, "src/a.test.ts", "export interface TestFile {}\n");
    await writeSource(root, "src/types.d.ts", "export interface Declaration {}\n");
    await writeSource(root, "test/helper.ts", "export interface TestDirectory {}\n");
    await writeSource(root, "node_modules/x/index.ts", "export interface Dependency {}\n");

    const chunks = await collectChunks(root, ["."]);

    expect(chunks.map((chunk) => chunk.id)).toEqual(["src/a.ts::A", "src/nested/b.ts::b"]);
    expect(chunks.every((chunk) => !path.isAbsolute(chunk.filepath))).toBe(true);
    expect(chunks.every((chunk) => !chunk.filepath.includes("\\"))).toBe(true);
  });

  it("finds files when the root is nested under a skipped directory name", async () => {
    const temporaryBase = await createTemporaryRoot();
    const root = path.join(temporaryBase, "build", "project");

    await writeSource(root, "src/a.ts", "export interface A {}\n");

    const chunks = await collectChunks(root, ["src"]);

    expect(chunks.map((chunk) => chunk.id)).toEqual(["src/a.ts::A"]);
  });

  it("sorts chunk IDs using code-unit order", async () => {
    const root = await createTemporaryRoot();

    await writeSource(root, "src/B.ts", "export interface B {}\n");
    await writeSource(root, "src/a.ts", "export interface a {}\n");

    const chunks = await collectChunks(root, ["src"]);

    expect(chunks.map((chunk) => chunk.id)).toEqual(["src/B.ts::B", "src/a.ts::a"]);
  });

  it("adds #2 to duplicate IDs from one file", async () => {
    const root = await createTemporaryRoot();

    await writeSource(
      root,
      "src/duplicates.ts",
      ["export interface Shared {}", "export class Shared {}"].join("\n"),
    );

    const chunks = await collectChunks(root, ["src/duplicates.ts"]);

    expect(chunks.map((chunk) => chunk.id)).toEqual([
      "src/duplicates.ts::Shared",
      "src/duplicates.ts::Shared#2",
    ]);
  });

  it("rejects a missing code path with the path in the error", async () => {
    const root = await createTemporaryRoot();

    await expect(walkSourceFiles(root, ["src/missing.ts"])).rejects.toThrow("src/missing.ts");
  });

  it("ignores symlinks when the platform supports creating them", async (context) => {
    const root = await createTemporaryRoot();
    const target = path.join(root, "src", "real.ts");
    const link = path.join(root, "src", "linked.ts");

    await writeSource(root, "src/real.ts", "export interface Real {}\n");

    try {
      await symlink(target, link);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : undefined;

      if (code === "EACCES" || code === "EPERM" || code === "ENOTSUP" || code === "ENOSYS") {
        context.skip(`Symlinks are not supported: ${code}`);
        return;
      }

      throw error;
    }

    await expect(walkSourceFiles(root, ["src"])).resolves.toEqual(["src/real.ts"]);
  });
});
