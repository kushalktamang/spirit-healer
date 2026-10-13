import ts from "typescript";
import type { CodeChunk } from "../types/types.js";
import { addDocComment, getLine, hasModifier } from "./helpers.js";

const isExportedFunction = (
  node: ts.Statement,
): node is ts.FunctionDeclaration & { name: ts.Identifier; body: ts.Block } =>
  ts.isFunctionDeclaration(node) &&
  node.name !== undefined &&
  node.body !== undefined &&
  hasModifier(node, ts.SyntaxKind.ExportKeyword);

// parse function
const parseFunction = (
  filepath: string,
  sourceFile: ts.SourceFile,
  node: ts.FunctionDeclaration & { name: ts.Identifier; body: ts.Block },
): CodeChunk => {
  const chunk: CodeChunk = {
    id: `${filepath}::${node.name.text}`,
    filepath,
    name: node.name.text,
    content: node.getText(sourceFile),
    signature: sourceFile.text
      .slice(node.getStart(sourceFile), node.body.getStart(sourceFile))
      .trim(),
    kind: "function",
    startLine: getLine(sourceFile, node.getStart(sourceFile, true)),
    endLine: getLine(sourceFile, node.getEnd()),
  };

  addDocComment(chunk, node, sourceFile);

  return chunk;
};

export { isExportedFunction, parseFunction };
