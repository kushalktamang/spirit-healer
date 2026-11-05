import ts from "typescript";

import type { CodeChunk } from "../types/types.js";
import { addDocComment, getLine, hasModifier } from "./helpers.js";

const isExportedEnum = (node: ts.Statement): node is ts.EnumDeclaration =>
  ts.isEnumDeclaration(node) && hasModifier(node, ts.SyntaxKind.ExportKeyword);

const parseEnum = (
  filepath: string,
  sourceFile: ts.SourceFile,
  node: ts.EnumDeclaration,
): CodeChunk => {
  const name = node.name.text;
  const content = node.getText(sourceFile);

  const chunk: CodeChunk = {
    id: `${filepath}::${name}`,
    filepath,
    name,
    content,
    signature: content,
    kind: "enum",
    startLine: getLine(sourceFile, node.getStart(sourceFile, true)),
    endLine: getLine(sourceFile, node.getEnd()),
  };

  addDocComment(chunk, node, sourceFile);
  return chunk;
};

export { isExportedEnum, parseEnum };
