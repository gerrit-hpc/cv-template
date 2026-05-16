import { Type } from "typebox";
import { db } from "@/server/data/db";
import { TailoringStrategyContentSchema } from "@/server/validation/application";
import { zodToFieldErrors } from "@/server/actions/helpers";
import type { KbTool } from "@/lib/chat/tools/types";

const parameters = Type.Object({
  content: Type.Unknown(),
});

const DESCRIPTION =
  "Propose a tailoring strategy for this application. The strategy is staged as a pending proposal; the user reviews it in the UI and approves, edits, or rejects it before it is saved to the application. " +
  "After calling this tool, end your turn. Do NOT call additional tools or generate further text. The user will approve, edit, or reject the proposal in the UI; their next message will tell you the outcome.";

export function makeProposeTailoringStrategyTool(
  applicationId: number,
  userId: number,
): KbTool<typeof parameters> {
  return {
    name: "propose_tailoring_strategy",
    description: DESCRIPTION,
    parameters,
    async execute(args, ctx) {
      if (!ctx) throw new Error("propose_tailoring_strategy: adapters must pass ctx with toolCallId");
      const app = await db.application.findFirst({ // scopeToUser: userId param
        where: { id: applicationId, userId },
        select: { id: true, slug: true, company: true, roleTitle: true },
      });
      if (!app) return { isError: true, error: "Application not found" };

      const parsed = TailoringStrategyContentSchema.safeParse(args.content);
      if (!parsed.success) {
        return {
          isError: true,
          error: "Strategy content failed validation",
          fieldErrors: zodToFieldErrors(parsed.error),
        };
      }

      const row = await db.chatToolCall.create({ // scopeToUser: applicationId belongs to verified app above
        data: {
          applicationId,
          toolName: "propose_tailoring_strategy",
          toolUseId: ctx.toolCallId,
          args: parsed.data,
          status: "pending",
        },
      });

      return {
        proposalId: row.id,
        status: "pending_approval" as const,
        summary: `Tailoring strategy: ${parsed.data.strategy.headlineSummary}`,
      };
    },
  };
}
