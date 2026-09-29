import * as ts from "typescript";
import { CodeChunk } from "../types/types.js";

// filepath: src/utils/math.ts
// source: exported funtions -> add(x, y);
const parseFile = (filepath: string, source: string): CodeChunk[] => {
  const sourceFile = ts.createSourceFile(
    filepath,
    source,
    ts.ScriptTarget.ES2022,
    true,
  );

  const functions: CodeChunk[] = [];

  for (const node of sourceFile.statements) {
    if (!ts.isFunctionDeclaration(node)) {
      continue;
    }

    const isExported = node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );

    if (!isExported || !node.name || !node.body) {
      continue;
    }

    const name = node.name.text;

    const { line: start } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile, /* includeJsDocComment */ true),
    );
    const startLine = start + 1;

    const { line: end } = sourceFile.getLineAndCharacterOfPosition(
      node.getEnd(),
    );
    const endLine = end + 1;

    const content = node.getText(sourceFile);

    const signature = source
      .slice(node.getStart(sourceFile), node.body.getStart(sourceFile))
      .trim();

    const jsDoc = ts.getJSDocCommentsAndTags(node);

    const docComment = jsDoc.length
      ? jsDoc.map((comment) => comment.getText(sourceFile)).join("\n")
      : undefined;

    const chunk: CodeChunk = {
      id: `${filepath}::${name}`,
      filepath,
      name,
      content,
      signature,
      kind: "function",
      startLine,
      endLine,
    };

    if (docComment !== undefined) {
      chunk.docComment = docComment;
    }

    functions.push(chunk);
  }
  return functions;
};

export { parseFile };
