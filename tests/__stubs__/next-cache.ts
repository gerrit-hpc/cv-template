// Stub for next/cache used in vitest; no-ops are fine since tests assert DB state directly.
export function revalidatePath(_path: string): void {
  // no-op in test environment
}

export function revalidateTag(_tag: string): void {
  // no-op in test environment
}
