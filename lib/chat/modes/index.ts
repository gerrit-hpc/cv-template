import type { ChatMode } from "./types.js";

export type { ChatMode } from "./types.js";

const registry: Record<string, ChatMode> = {};

export function getMode(id: string): ChatMode | null {
  return registry[id] ?? null;
}
