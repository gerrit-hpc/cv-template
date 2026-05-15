export const CURRENT_USER_ID = 1 as const;

export function scopeToUser<T extends { userId?: number }>(where: T): T & { userId: number } {
  if (where.userId !== undefined && where.userId !== CURRENT_USER_ID) {
    throw new Error(`userId mismatch: got ${where.userId}, expected ${CURRENT_USER_ID}`);
  }
  return { ...where, userId: CURRENT_USER_ID };
}
