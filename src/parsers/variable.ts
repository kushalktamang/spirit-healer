import ts from "typescript";

import type { CodeChunk } from "../types/types.js";
import { addDocComment, getLine, hasModifier } from "./helpers.js";

const isExportedVariable = (node: ts.Statement): node is ts.VariableStatement => {
  return ts.isVariableStatement(node) && hasModifier(node, ts.SyntaxKind.ExportKeyword);
};

/**
 * Decisions:
 * - Extract only function-valued exported variables (arrow functions and function expressions).
 * - Ignore constants, object literals, and destructured declarations for now.
 * - Use kind "function" for consistency with function declarations.
 * - Read JSDoc from the VariableStatement, not the individual VariableDeclaration.
 * - Range rule: a statement with ONE declaration is described by the whole statement, so
 *   content/signature keep `export const` and the lines include the JSDoc. A statement with
 *   SEVERAL declarations (`export const a = ..., b = ...`) uses each declaration's own range,
 *   so chunks never contain each other's code. Those chunks lose the `export const` prefix.
 *
 * Note: Multiple declarations in one statement share the same JSDoc comment.
 */
const parseVariable = (
  filepath: string,
  sourceFile: ts.SourceFile,
  node: ts.VariableStatement,
): CodeChunk[] => {
  const chunks: CodeChunk[] = [];
  const { declarations } = node.declarationList;

  for (const declaration of declarations) {
    // Ignore destructuring and non-function variables.
    if (
      ts.isIdentifier(declaration.name) &&
      declaration.initializer !== undefined &&
      (ts.isArrowFunction(declaration.initializer) ||
        ts.isFunctionExpression(declaration.initializer))
    ) {
      const func = declaration.initializer;
      const name = declaration.name.text;

      // The node whose text and line range describe this chunk (see range rule above).
      const range = declarations.length === 1 ? node : declaration;

      const chunk: CodeChunk = {
        id: `${filepath}::${name}`,
        filepath,
        name,
        content: range.getText(sourceFile),
        signature: sourceFile.text
          .slice(range.getStart(sourceFile), func.body.getStart(sourceFile))
          .trim(),
        kind: "function",
        // `true` includes a leading JSDoc comment. It is harmless on a declaration.
        startLine: getLine(sourceFile, range.getStart(sourceFile, true)),
        endLine: getLine(sourceFile, range.getEnd()),
      };

      addDocComment(chunk, node, sourceFile);

      chunks.push(chunk);
    }
  }
  return chunks;
};

export { isExportedVariable, parseVariable };
