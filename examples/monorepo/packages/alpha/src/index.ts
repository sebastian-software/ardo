/**
 * Adds two numbers.
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b
}

/**
 * Subtracts the second number from the first.
 * @param a - The number to subtract from
 * @param b - The number to subtract
 * @returns The difference
 */
export function subtract(a: number, b: number): number {
  return a - b
}

/**
 * Multiplies two numbers.
 * @param a - First factor
 * @param b - Second factor
 * @returns The product
 */
export function multiply(a: number, b: number): number {
  return a * b
}

/**
 * Divides the first number by the second.
 * @param a - The dividend
 * @param b - The divisor
 * @returns The quotient
 * @throws Error if b is zero
 */
export function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero")
  return a / b
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
