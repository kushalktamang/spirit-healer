import ts from "typescript";

import type { CodeChunk } from "../types/types.js";
import { addDocComment, getLine, isExported } from "./helpers.js";

// Checks whether an interface is exported.
const isExportedInterface = (
  node: ts.Statement,
  exportedNames: Set<string>,
): node is ts.InterfaceDeclaration =>
  ts.isInterfaceDeclaration(node) && isExported(node, node.name.text, exportedNames);

// Extracts the interface declaration and creates a chunk.
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
