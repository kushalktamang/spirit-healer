import ts from "typescript";
import type { CodeChunk } from "../types/types.js";
import { isExportedFunction, parseFunction } from "./function.js";
import { isExportedClass, parseClass } from "./class.js";
import {
  isExportedInterface,
  parseInterface,
} from "./interface.js";
import { isExportedType, parseType } from "./type.js";

const parseFile = (filepath: string, source: string): CodeChunk[] => {
  const sourceFile = ts.createSourceFile(filepath, source, ts.ScriptTarget.ES2022, true);

  const chunks: CodeChunk[] = [];

  for (const node of sourceFile.statements) {
    if (isExportedFunction(node)) {
      chunks.push(parseFunction(filepath, sourceFile, node));
    } else if (isExportedClass(node)) {
      chunks.push(...parseClass(filepath, sourceFile, node));
    } else if (isExportedInterface(node)) {
      chunks.push(parseInterface(filepath, sourceFile, node));
    } else if (isExportedType(node)) {
      chunks.push(parseType(filepath, sourceFile, node));
    }
  }

  return chunks;
};

export default parseFile;
