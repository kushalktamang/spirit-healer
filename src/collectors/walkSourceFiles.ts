import { lstat, readdir } from "node:fs/promises";
import path from "node:path";

import { isSourceFile, SKIP_DIRECTORIES } from "./isSourceFile.js";

const lstatCodePath = async (
  codePath: string,
  absolutePath: string,
): Promise<Awaited<ReturnType<typeof lstat>>> => {
  try {
    return await lstat(absolutePath);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to inspect code path "${codePath}" (${absolutePath}): ${reason}`, {
      cause: error,
    });
  }
};

const walkSourceFiles = async (rootDir: string, codePaths: string[]): Promise<string[]> => {
  const root = path.resolve(rootDir);
  const files = new Set<string>();

  const walk = async (absolutePath: string): Promise<void> => {
    const entries = await readdir(absolutePath, {
      withFileTypes: true,
    });

    const tasks = entries.map(async (entry) => {
      const entryPath = path.join(absolutePath, entry.name);

      if (entry.isSymbolicLink()) {
        // Symlinks are ignored to avoid traversing outside the root or duplicating files.
        return;
      }

      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) {
          await walk(entryPath);
        }
        return;
      }

      if (entry.isFile()) {
        const relativePath = path.relative(root, entryPath).split(path.sep).join("/");

        if (isSourceFile(relativePath)) {
          files.add(relativePath);
        }
      }
    });

    await Promise.all(tasks);
  };

  const tasks = codePaths.map(async (codePath) => {
    const absolutePath = path.resolve(root, codePath);
    const stats = await lstatCodePath(codePath, absolutePath);

    if (stats.isSymbolicLink()) {
      // Symlinks are ignored.
      return;
    }

    if (stats.isFile()) {
      const relativePath = path.relative(root, absolutePath).split(path.sep).join("/");

      if (isSourceFile(relativePath)) {
        files.add(relativePath);
      }
    } else if (stats.isDirectory()) {
      await walk(absolutePath);
    }
  });

  await Promise.all(tasks);

  // Files are sorted by code unit for deterministic output across runtimes.
  return [...files].toSorted();
};

export default walkSourceFiles;
