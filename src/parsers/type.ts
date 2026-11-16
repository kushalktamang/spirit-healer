import ts from "typescript";

import type { CodeChunk } from "../types/types.js";
import { addDocComment, getLine, isExported } from "./helpers.js";

// Checks whether a type alias is exported.
const isExportedType = (
  node: ts.Statement,
  exportedNames: Set<string>,
): node is ts.TypeAliasDeclaration =>
  ts.isTypeAliasDeclaration(node) && isExported(node, node.name.text, exportedNames);

// Extracts the type declaration and creates a chunk.
const parseType = (
  filepath: string,
  sourceFile: ts.SourceFile,
  node: ts.TypeAliasDeclaration,
): CodeChunk => {
  const name = node.name.text;
  const content = node.getText(sourceFile);

  const chunk: CodeChunk = {
    id: `${filepath}::${name}`,
    filepath,
    name,
    content,
    signature: content,
    kind: "type",
    startLine: getLine(sourceFile, node.getStart(sourceFile, true)),
    endLine: getLine(sourceFile, node.getEnd()),
  };

  addDocComment(chunk, node, sourceFile);
  return chunk;
};

export { isExportedType, parseType };
