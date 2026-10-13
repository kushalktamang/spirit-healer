type ChunkKind = "function" | "class" | "method" | "interface" | "type" | "variable" | "enum";

interface CodeChunk {
  /** Stable identifier: `${filepath}::${name}`. Survives reordering and unrelated edits. */
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
