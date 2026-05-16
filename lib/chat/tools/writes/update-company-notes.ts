import { Type } from "typebox";
import { db } from "@/server/data/db";
import { CompanyNotesContentSchema } from "@/server/validation/application";
import { zodToFieldErrors } from "@/server/actions/helpers";
import type { KbTool } from "@/lib/chat/tools/types";

const parameters = Type.Object({
  content: Type.Unknown(),
});

const DESCRIPTION =
  "Update company-research notes for this application. The notes are staged as a pending proposal; the user reviews them in the UI and approves, edits, or rejects before they are saved. " +
  "After calling this tool, end your turn. Do NOT call additional tools or generate further text. The user will approve, edit, or reject the proposal in the UI; their next message will tell you the outcome.";

export function makeUpdateCompanyNotesTool(
  applicationId: number,
  userId: number,
): KbTool<typeof parameters> {
  return {
    name: "update_company_notes",
    description: DESCRIPTION,
    parameters,
    async execute(args, ctx) {
      if (!ctx) throw new Error("update_company_notes: adapters must pass ctx with toolCallId");
      const app = await db.application.findFirst({ // scopeToUser: userId param
        where: { id: applicationId, userId },
        select: { id: true, slug: true, company: true, roleTitle: true },
      });
      if (!app) return { isError: true, error: "Application not found" };

      const parsed = CompanyNotesContentSchema.safeParse(args.content);
      if (!parsed.success) {
        return {
          isError: true,
          error: "Company notes failed validation",
          fieldErrors: zodToFieldErrors(parsed.error),
        };
      }

      const row = await db.chatToolCall.create({ // scopeToUser: applicationId belongs to verified app above
        data: {
          applicationId,
          toolName: "update_company_notes",
          toolUseId: ctx.toolCallId,
          args: parsed.data,
          status: "pending",
        },
      });

      return {
        proposalId: row.id,
        status: "pending_approval" as const,
        summary: `Company notes for ${app.company}`,
      };
    },
  };
}
