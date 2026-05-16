import type { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";
import { upsertTailoringStrategy } from "@/server/actions/tailoring-strategy";
import { upsertCompanyNotes } from "@/server/actions/company-notes";
import { upsertInterviewPrepBrief } from "@/server/actions/interview-prep-brief";
import {
  TailoringStrategyContentSchema,
  CompanyNotesContentSchema,
  InterviewPrepBriefContentSchema,
  type TailoringStrategyContent,
  type CompanyNotesContent,
  type InterviewPrepBriefContent,
} from "@/server/validation/application";

const STAGE_NAME_RE = /^[a-z0-9-]+$/;

// Key-order-independent structural equality. Postgres JSONB re-orders keys, so
// JSON.stringify comparison would false-negative on retrieved args.
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ka = Object.keys(ao);
  const kb = Object.keys(bo);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => k in bo && deepEqual(ao[k], bo[k]));
}

export type ProposalRow = {
  id: number;
  applicationId: number;
  toolName: string;
  toolUseId: string;
  args: Prisma.JsonValue;
  status: "pending" | "approved" | "edited" | "rejected" | "cancelled" | "errored";
  resolvedContent: Prisma.JsonValue | null;
  resolutionError: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
};

export async function loadProposalScopedToCurrentUser(id: number): Promise<ProposalRow | null> {
  return (await db.chatToolCall.findFirst({ // scopeToUser: via application.userId
    where: { id, application: { userId: CURRENT_USER_ID } },
  })) as ProposalRow | null;
}

export async function approveProposal(
  id: number,
  editedContent?: unknown,
): Promise<ActionResult<ProposalRow>> {
  const proposal = await loadProposalScopedToCurrentUser(id);
  if (!proposal) return err("NOT_FOUND", "Proposal not found.");

  if (proposal.status !== "pending") {
    return ok(proposal);
  }

  const hasEdit = editedContent !== undefined;
  // For save_brief, args carries { stageName, content }; the other two store the payload directly.
  const argsObj = proposal.args as Record<string, unknown> | null;

  // Resolve the effective payload + run zod validation BEFORE touching the row.
  // A validation failure on edited content must return VALIDATION_FAILED without
  // marking the proposal terminal — otherwise a single typo bricks the proposal
  // (status flips to errored, idempotent-on-terminal short-circuits subsequent retries).
  let actionResult: ActionResult<null>;
  let resolved: unknown;
  let wasEdited = false;
  switch (proposal.toolName) {
    case "propose_tailoring_strategy": {
      const raw = hasEdit ? editedContent : argsObj;
      const parsed = TailoringStrategyContentSchema.safeParse(raw);
      if (!parsed.success) {
        return err(
          "VALIDATION_FAILED",
          hasEdit ? "Edited strategy failed validation." : "Strategy malformed.",
          zodToFieldErrors(parsed.error),
        );
      }
      const content = parsed.data as TailoringStrategyContent;
      wasEdited = hasEdit && !deepEqual(content, argsObj);
      resolved = content;
      actionResult = await upsertTailoringStrategy(proposal.applicationId, content);
      break;
    }
    case "update_company_notes": {
      const raw = hasEdit ? editedContent : argsObj;
      const parsed = CompanyNotesContentSchema.safeParse(raw);
      if (!parsed.success) {
        return err(
          "VALIDATION_FAILED",
          hasEdit ? "Edited notes failed validation." : "Notes malformed.",
          zodToFieldErrors(parsed.error),
        );
      }
      const content = parsed.data as CompanyNotesContent;
      wasEdited = hasEdit && !deepEqual(content, argsObj);
      resolved = content;
      actionResult = await upsertCompanyNotes(proposal.applicationId, content);
      break;
    }
    case "save_brief": {
      const stageName =
        hasEdit && (editedContent as { stageName?: string })?.stageName
          ? (editedContent as { stageName: string }).stageName
          : (argsObj?.stageName as string);
      const rawContent = hasEdit
        ? ((editedContent as { content?: unknown }).content ?? editedContent)
        : argsObj?.content;
      if (!STAGE_NAME_RE.test(stageName ?? "")) {
        return err("VALIDATION_FAILED", "stageName must be kebab-case.", { stageName: "Invalid" });
      }
      const parsed = InterviewPrepBriefContentSchema.safeParse(rawContent);
      if (!parsed.success) {
        return err(
          "VALIDATION_FAILED",
          hasEdit ? "Edited brief failed validation." : "Brief malformed.",
          zodToFieldErrors(parsed.error),
        );
      }
      const content = parsed.data as InterviewPrepBriefContent;
      const editedWrapper = { stageName, content };
      wasEdited = hasEdit && !deepEqual(editedWrapper, argsObj);
      resolved = editedWrapper;
      actionResult = await upsertInterviewPrepBrief(proposal.applicationId, stageName, content);
      break;
    }
    default:
      return err("VALIDATION_FAILED", `Unknown tool: ${proposal.toolName}`);
  }

  if (!actionResult.ok) {
    const errored = (await db.chatToolCall.update({ // scopeToUser: proposal id verified via loadProposalScopedToCurrentUser above
      where: { id },
      data: {
        status: "errored",
        resolutionError: actionResult.error.message,
        resolvedAt: new Date(),
      },
    })) as ProposalRow;
    void errored;
    return actionResult as ActionResult<ProposalRow>;
  }

  const updated = (await db.chatToolCall.update({ // scopeToUser: proposal id verified via loadProposalScopedToCurrentUser above
    where: { id },
    data: {
      status: wasEdited ? "edited" : "approved",
      resolvedContent: resolved as Prisma.InputJsonValue,
      resolvedAt: new Date(),
    },
  })) as ProposalRow;
  return ok(updated);
}

export async function rejectProposal(id: number): Promise<ActionResult<ProposalRow>> {
  const proposal = await loadProposalScopedToCurrentUser(id);
  if (!proposal) return err("NOT_FOUND", "Proposal not found.");
  if (proposal.status !== "pending") return ok(proposal);
  const updated = (await db.chatToolCall.update({ // scopeToUser: proposal id verified via loadProposalScopedToCurrentUser above
    where: { id },
    data: { status: "rejected", resolvedAt: new Date() },
  })) as ProposalRow;
  return ok(updated);
}

/**
 * Cancel any pending proposals created by this stream.
 *
 * Scoped by (applicationId, toolUseId set). Using toolUseId instead of the numeric
 * proposalId closes the race where the route's abort check fires between the adapter
 * yielding a `tool_result` event and the route appending its `proposalId`: tool_call
 * events are emitted BEFORE execute() runs, so toolUseIds are recorded regardless of
 * whether the corresponding tool_result was processed.
 */
export async function cancelStreamProposals(
  applicationId: number,
  toolUseIds: string[],
): Promise<void> {
  if (toolUseIds.length === 0) return;
  await db.chatToolCall.updateMany({ // scopeToUser: applicationId verified at route entry
    where: {
      applicationId,
      toolUseId: { in: toolUseIds },
      status: "pending",
    },
    data: { status: "cancelled", resolvedAt: new Date() },
  });
}
