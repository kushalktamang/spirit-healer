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
