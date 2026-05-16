import type { KbTool } from "@/lib/chat/tools/types";
import { makeProposeTailoringStrategyTool } from "./propose-tailoring-strategy";
import { makeUpdateCompanyNotesTool } from "./update-company-notes";
import { makeSaveBriefTool } from "./save-brief";

export const WRITE_TOOL_NAMES = [
  "propose_tailoring_strategy",
  "update_company_notes",
  "save_brief",
] as const;

export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number];

export function isWriteToolName(name: string): name is WriteToolName {
  return (WRITE_TOOL_NAMES as readonly string[]).includes(name);
}

export function buildWriteTools(applicationId: number, userId: number): KbTool[] {
  return [
    makeProposeTailoringStrategyTool(applicationId, userId),
    makeUpdateCompanyNotesTool(applicationId, userId),
    makeSaveBriefTool(applicationId, userId),
  ];
}
