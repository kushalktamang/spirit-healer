import ts from "typescript";

import type { CodeChunk } from "../types/types.js";
import { addDocComment, getLine, hasModifier } from "./helpers.js";

const isExportedInterface = (node: ts.Statement): node is ts.InterfaceDeclaration =>
  ts.isInterfaceDeclaration(node) && hasModifier(node, ts.SyntaxKind.ExportKeyword);

const parseInterface = (
  filepath: string,
  sourceFile: ts.SourceFile,
  node: ts.InterfaceDeclaration,
): CodeChunk => {
  const name = node.name.text;
  const content = node.getText(sourceFile);

  const chunk: CodeChunk = {
    id: `${filepath}::${name}`,
    filepath,
    name,
    content,
    signature: content,
    kind: "interface",
    startLine: getLine(sourceFile, node.getStart(sourceFile, true)),
    endLine: getLine(sourceFile, node.getEnd()),
  };

  addDocComment(chunk, node, sourceFile);
  return chunk;
};

export { isExportedInterface, parseInterface };
