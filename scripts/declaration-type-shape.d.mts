export type TypeShapeOptions = {
  normalize?: boolean
  /** Names confirmed to refer to the standard global array types. */
  arrayNames?: readonly string[]
}

export function typeShape(value: unknown, options?: TypeShapeOptions): unknown
export function globalArrayNames(programs: readonly unknown[]): string[]
