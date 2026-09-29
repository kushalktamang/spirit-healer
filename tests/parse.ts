import { parseFile } from "../src/parsers/code.js";

const source = `
/** Adds two numbers. */
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

`;

console.log(JSON.stringify(parseFile("src/math.ts", source), null, 2));
