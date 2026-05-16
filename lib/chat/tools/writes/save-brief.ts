import { Type } from "typebox";
import { db } from "@/server/data/db";
import { InterviewPrepBriefContentSchema } from "@/server/validation/application";
import { zodToFieldErrors } from "@/server/actions/helpers";
import type { KbTool } from "@/lib/chat/tools/types";

const parameters = Type.Object({
  stageName: Type.String(),
  content: Type.Unknown(),
});

const DESCRIPTION =
  "Save an interview-prep brief for a specific stage of this application. The brief is staged as a pending proposal; the user reviews it in the UI and approves, edits, or rejects before it is saved. " +
  "stageName must be kebab-case (e.g. \"recruiter-screen\", \"hiring-manager\"). " +
  "After calling this tool, end your turn. Do NOT call additional tools or generate further text. The user will approve, edit, or reject the proposal in the UI; their next message will tell you the outcome.";

const STAGE_NAME_RE = /^[a-z0-9-]+$/;

export function makeSaveBriefTool(applicationId: number, userId: number): KbTool<typeof parameters> {
  return {
    name: "save_brief",
    description: DESCRIPTION,
    parameters,
    async execute(args, ctx) {
      if (!ctx) throw new Error("save_brief: adapters must pass ctx with toolCallId");
      const app = await db.application.findFirst({ // scopeToUser: userId param
        where: { id: applicationId, userId },
        select: { id: true, slug: true, company: true, roleTitle: true },
      });
      if (!app) return { isError: true, error: "Application not found" };

      if (!STAGE_NAME_RE.test(args.stageName)) {
        return {
          isError: true,
          error: "stageName must be kebab-case (e.g. recruiter-screen)",
        };
      }

      const parsed = InterviewPrepBriefContentSchema.safeParse(args.content);
      if (!parsed.success) {
        return {
          isError: true,
          error: "Brief content failed validation",
          fieldErrors: zodToFieldErrors(parsed.error),
        };
      }

      const row = await db.chatToolCall.create({ // scopeToUser: applicationId belongs to verified app above
        data: {
          applicationId,
          toolName: "save_brief",
          toolUseId: ctx.toolCallId,
          args: { stageName: args.stageName, content: parsed.data },
          status: "pending",
        },
      });

      return {
        proposalId: row.id,
        status: "pending_approval" as const,
        summary: `Interview brief — ${args.stageName}`,
      };
    },
  };
}
