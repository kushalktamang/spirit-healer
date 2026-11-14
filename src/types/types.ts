type ChunkKind = "function" | "class" | "method" | "interface" | "type" | "variable" | "enum";

interface CodeChunk {
  /**
   * Base identifier: `${filepath}::${name}`. collectChunks may append #n to disambiguate
   * duplicates. Unique IDs survive reordering and unrelated edits. Duplicate suffixes are assigned
   * in discovery order, so reordering same-named declarations can swap which declaration gets #2;
   * this is an accepted rare tradeoff that Phase 2 may report as two changes.
   */
  id: string;
  filepath: string;
  name: string;
  content: string;
  signature: string;
  kind: ChunkKind;
  docComment?: string;

  /** 1-based, inclusive source line numbers. */
  startLine: number;
  endLine: number;
}

export type { ChunkKind, CodeChunk };
