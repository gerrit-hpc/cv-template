import type { ChatMode } from "./types.js";
import { tailorMode } from "./tailor.js";

export type { ChatMode } from "./types.js";

const registry: Record<string, ChatMode> = {
  [tailorMode.id]: tailorMode,
};

export function getMode(id: string): ChatMode | null {
  return registry[id] ?? null;
}
