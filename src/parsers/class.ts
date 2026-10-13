import ts from "typescript";
import type { CodeChunk } from "../types/types.js";
import { addDocComment, getLine, hasModifier } from "./helpers.js";

const isExportedClass = (
  node: ts.Statement,
): node is ts.ClassDeclaration & { name: ts.Identifier } =>
  ts.isClassDeclaration(node) &&
  node.name !== undefined &&
  hasModifier(node, ts.SyntaxKind.ExportKeyword);

const parseClass = (
  filepath: string,
  sourceFile: ts.SourceFile,
  node: ts.ClassDeclaration & {
    name: ts.Identifier;
  },
): CodeChunk[] => {
  const className = node.name.text;

  const header = sourceFile.text.slice(node.getStart(sourceFile), node.members.pos).trim();

  const signature = header.endsWith("{") ? header.slice(0, -1).trimEnd() : header;

  // Keep method bodies out of the class chunk to reduce diff noise.
  const classChunk: CodeChunk = {
    id: `${filepath}::${className}`,
    filepath,
    name: className,
    content: `${header}\n}`,
    signature,
    kind: "class",
    startLine: getLine(sourceFile, node.getStart(sourceFile, true)),
    endLine: getLine(sourceFile, node.getEnd()),
  };

  addDocComment(classChunk, node, sourceFile);

  const methodChunks: CodeChunk[] = [];

  for (const member of node.members) {
    if (
      !ts.isMethodDeclaration(member) ||
      !ts.isIdentifier(member.name) ||
      member.body === undefined ||
      hasModifier(member, ts.SyntaxKind.PrivateKeyword) ||
      hasModifier(member, ts.SyntaxKind.ProtectedKeyword)
    ) {
      continue;
    }

    const methodName = member.name.text;

    const methodChunk: CodeChunk = {
      id: `${filepath}::${className}.${methodName}`,
      filepath,
      name: `${className}.${methodName}`,
      content: member.getText(sourceFile),
      signature: sourceFile.text
        .slice(member.getStart(sourceFile), member.body.getStart(sourceFile))
        .trim(),
      kind: "method",
      startLine: getLine(sourceFile, member.getStart(sourceFile, true)),
      endLine: getLine(sourceFile, member.getEnd()),
    };

    addDocComment(methodChunk, member, sourceFile);
    methodChunks.push(methodChunk);
  }

  return [classChunk, ...methodChunks];
};

export { isExportedClass, parseClass };
