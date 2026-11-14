import ts from "typescript";

import type { CodeChunk } from "../types/types.js";
import { isExportedClass, parseClass } from "./class.js";
import { isExportedEnum, parseEnum } from "./enum.js";
import { isExportedFunction, parseFunction } from "./function.js";
import { collectExportedNames } from "./helpers.js";
import { isExportedInterface, parseInterface } from "./interface.js";
import { isExportedType, parseType } from "./type.js";
import { isExportedVariable, parseVariable } from "./variable.js";

const parseFile = (filepath: string, source: string): CodeChunk[] => {
  const sourceFile = ts.createSourceFile(filepath, source, ts.ScriptTarget.ES2022, true);
  const exportedNames = collectExportedNames(sourceFile);

  const chunks: CodeChunk[] = [];

  for (const node of sourceFile.statements) {
    if (isExportedFunction(node, exportedNames)) {
      chunks.push(parseFunction(filepath, sourceFile, node));
    } else if (isExportedClass(node, exportedNames)) {
      chunks.push(...parseClass(filepath, sourceFile, node));
    } else if (isExportedInterface(node, exportedNames)) {
      chunks.push(parseInterface(filepath, sourceFile, node));
    } else if (isExportedType(node, exportedNames)) {
      chunks.push(parseType(filepath, sourceFile, node));
    } else if (isExportedEnum(node, exportedNames)) {
      chunks.push(parseEnum(filepath, sourceFile, node));
    } else if (isExportedVariable(node, exportedNames)) {
      chunks.push(...parseVariable(filepath, sourceFile, node, exportedNames));
    }
  }

  return chunks;
};

export default parseFile;
