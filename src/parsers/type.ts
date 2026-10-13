
import ts from "typescript";
import type { CodeChunk } from "../types/types.js";
import { addDocComment, getLine, hasModifier } from "./helpers.js";

const isExportedType = (
  node: ts.Statement,
): node is ts.TypeAliasDeclaration =>
  ts.isTypeAliasDeclaration(node) &&
  hasModifier(node, ts.SyntaxKind.ExportKeyword);

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
