type ChunkKind = "function" | "class" | "method" | "interface" | "type" | "variable" | "enum";

/**
 * Base identifier: `${filepath}::${name}`. collectChunks may append #n to disambiguate
 * duplicates. Unique IDs survive reordering and unrelated edits. Duplicate suffixes are assigned
 * in discovery order, so reordering same-named declarations can swap which declaration gets #2;
 * this is an accepted rare tradeoff that Phase 2 may report as two changes.
 */
interface CodeChunk {
  // Unique identifier for the chunk.
  id: string;
  // Original source-file path.
  filepath: string;
  // Name of the declaration.
  name: string;
  // Actual source code.
  content: string;
  // Declaration signature without implementation where applicable.
  signature: string;
  // Type of declaration.
  kind: ChunkKind;
  // Optional JSDoc documentation.
  docComment?: string;

  /** 1-based, inclusive source line numbers. */
  // Starting source line.
  startLine: number;
  // Ending source line.
  endLine: number;
}

export type { ChunkKind, CodeChunk };
