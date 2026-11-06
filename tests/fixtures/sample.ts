export class Calculator {
  /**
   * Adds two numbers.
   * @param a first number
   * @param b second number
   * @returns the sum
   */
  add(a: number, b: number): number {
    return a + b;
  }

  private helper() {
    return 1;
  }
}

export function subtract(a: number, b: number): number {
  return a - b;
}

function internalHelper(): number {
  return 0;
}

/** Client options. */
export interface Options {
  retries: number;
}

export type Mode = "fast" | "safe";

type Hidden = string;

/** Log levels. */
export enum Level {
  Debug = 0,
  Info = 1,
}

enum Internal {
  A,
}

/** Multiplies two numbers. */
export const multiply = (a: number, b: number): number => a * b;

export const divide = (a: number, b: number): number => {
  return a / b;
};

export const MAX = 5;

const privateFn = () => 1;
