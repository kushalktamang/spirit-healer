/*
 - The Use of collectChunks()
1. Resolve project root.
2. Discover source files.
3. Read each source file.
4. Parse each file into chunks.
5. Flatten and deduplicate chunks.
6. Sort and return the result. 
*/
import { readFile } from "node:fs/promises";
import path from "node:path";

import parseFile from "../parsers/parseFile.js";
import type { CodeChunk } from "../types/types.js";
import walkSourceFiles from "./walkSourceFiles.js";

// Reads a source file using fs/promises.
// Resolves the absolute path and provides a descriptive error if reading fails.
const readSourceFile = async (root: string, file: string): Promise<string> => {
  const absolutePath = path.resolve(root, file);

  try {
    return await readFile(absolutePath, "utf8");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to read source file "${file}" (${absolutePath}): ${reason}`, {
      cause: error,
    });
  }
};

// Compares two chunks by their IDs for alphabetical sorting.
const compareChunksById = (first: CodeChunk, second: CodeChunk): number => {
  if (first.id < second.id) {
    return -1;
  }

  if (first.id > second.id) {
    return 1;
  }

  return 0;
};

// Coordinates file discovery, reading, parsing, duplicate ID handling, and sorting.
export const collectChunks = async (rootDir: string, codePaths: string[]): Promise<CodeChunk[]> => {
  const root = path.resolve(rootDir);

  const files = await walkSourceFiles(root, codePaths);

  // Using the arrays of arrays and not a simple CodeChunk[]
  // Different source file can produce multiple chunks
  const fileChunks: CodeChunk[][] = [];

  // Read files sequentially to avoid opening every file at once.
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop -- Intentional to bound open files.
    const source = await readSourceFile(root, file);
    fileChunks.push(parseFile(file, source));
  }

  const chunks: CodeChunk[] = [];
  const usedIds = new Set<string>();

  // Handle duplicate IDs sequentially.
  for (const fileChunk of fileChunks) {
    for (const chunk of fileChunk) {
      const baseId = chunk.id;
      let uniqueId = baseId;
      let suffix = 2;

      while (usedIds.has(uniqueId)) {
        uniqueId = `${baseId}#${suffix}`;
        suffix += 1;
      }

      usedIds.add(uniqueId);

      chunks.push({
        ...chunk,
        id: uniqueId,
      });
    }
  }

  // Sort chunks by ID for deterministic output;
  // this intentionally groups names rather than source order.
  return chunks.toSorted(compareChunksById);
};

export default collectChunks;
