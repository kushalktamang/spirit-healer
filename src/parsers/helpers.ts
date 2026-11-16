import ts from "typescript";

import type { CodeChunk } from "../types/types.js";

// 	Converts a TypeScript source position into a 1-based line number.
const getLine = (sourceFile: ts.SourceFile, pos: number): number =>
  sourceFile.getLineAndCharacterOfPosition(pos).line + 1;

// Checks whether a TypeScript node has a specific modifier,
// such as export, private, or protected.
const hasModifier = (node: ts.Node, kind: ts.SyntaxKind): boolean =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false);

// Collects names exported through named export declarations
// and certain default export assignments.
const collectExportedNames = (sourceFile: ts.SourceFile): Set<string> => {
  const exportedNames = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (
        statement.moduleSpecifier === undefined &&
        statement.exportClause !== undefined &&
        ts.isNamedExports(statement.exportClause)
      ) {
        for (const element of statement.exportClause.elements) {
          // Keep the local declaration name for aliases (foo in `export { foo as bar }`) so IDs
          // stay tied to code and Phase 1 name matching remains direct. A README using public
          // name "bar" will not link to this "foo" chunk yet; revisit this in Day 3, potentially
          // with an optional `exportedAs` field on CodeChunk.
          exportedNames.add(element.propertyName?.text ?? element.name.text);
        }
      }
    } else if (
      ts.isExportAssignment(statement) &&
      statement.isExportEquals !== true &&
      ts.isIdentifier(statement.expression)
    ) {
      exportedNames.add(statement.expression.text);
    }
  }

  return exportedNames;
};

// 	Determines whether a declaration is exported directly or through an export list.
const isExported = (node: ts.Node, name: string, exportedNames: Set<string>): boolean =>
  hasModifier(node, ts.SyntaxKind.ExportKeyword) || exportedNames.has(name);

// Extracts JSDoc comments and attaches them to a chunk.
const addDocComment = (chunk: CodeChunk, node: ts.Node, sourceFile: ts.SourceFile): void => {
  const comments = ts.getJSDocCommentsAndTags(node);

  if (comments.length > 0) {
    chunk.docComment = comments.map((comment) => comment.getText(sourceFile)).join("\n");
  }
};

export { addDocComment, collectExportedNames, getLine, hasModifier, isExported };
