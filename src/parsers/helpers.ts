import ts from "typescript";
import type { CodeChunk } from "../types/types.js";

const getLine = (sourceFile: ts.SourceFile, pos: number): number =>
  sourceFile.getLineAndCharacterOfPosition(pos).line + 1;

const hasModifier = (node: ts.Node, kind: ts.SyntaxKind): boolean =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false);

const addDocComment = (chunk: CodeChunk, node: ts.Node, sourceFile: ts.SourceFile): void => {
  const comments = ts.getJSDocCommentsAndTags(node);

  if (comments.length > 0) {
    chunk.docComment = comments.map((comment) => comment.getText(sourceFile)).join("\n");
  }
};

export { getLine, addDocComment, hasModifier };
