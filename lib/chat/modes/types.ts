import type { KbTool } from "@/lib/chat/tools/types";

export interface ChatMode {
  id: string;
  label: string;
  systemPrompt: string;
  filterTools: (all: KbTool[]) => KbTool[];
}
