"use client";
import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProposalCardTailoringStrategy } from "./proposal-card-tailoring-strategy";
import { ProposalCardCompanyNotes } from "./proposal-card-company-notes";
import { ProposalCardBrief } from "./proposal-card-brief";

export type ProposalStatus =
  | "pending"
  | "approved"
  | "edited"
  | "rejected"
  | "cancelled"
  | "errored";

export interface Proposal {
  id?: number;
  toolUseId: string;
  toolName: string;
  args: unknown;
  status: ProposalStatus;
  resolvedContent?: unknown;
  resolutionError?: string | null;
}

interface Props {
  proposal: Proposal;
  onResolved: (updated: Proposal) => void;
}

const TITLES: Record<string, string> = {
  propose_tailoring_strategy: "Proposed tailoring strategy",
  update_company_notes: "Proposed company notes update",
  save_brief: "Proposed interview-prep brief",
};

const RESOLVED_LABEL: Record<ProposalStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  edited: "Approved with edits",
  rejected: "Rejected",
  cancelled: "Cancelled before review",
  errored: "Failed to commit",
};

export function ProposalCard({ proposal, onResolved }: Props) {
  const [mode, setMode] = useState<"pending" | "editing" | "submitting">("pending");
  const [edited, setEdited] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const title = TITLES[proposal.toolName] ?? proposal.toolName;
  const terminal = proposal.status !== "pending";

  const post = async (action: "approve" | "reject", body?: object) => {
    if (proposal.id === undefined) {
      setError("Proposal still streaming — wait for the server to acknowledge.");
      return;
    }
    setMode("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/chat/proposal/${proposal.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}",
      });
      const json = (await res.json()) as
        | { proposal: Proposal }
        | { error: { message: string } };
      if (!res.ok) {
        const msg = "error" in json ? json.error.message : `HTTP ${res.status}`;
        setError(msg);
        setMode("editing");
        return;
      }
      if ("proposal" in json) onResolved(json.proposal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
      setMode(action === "reject" ? "pending" : "editing");
    }
  };

  const renderBody = (content: unknown, editable: boolean) => {
    const shared = {
      content,
      editable,
      onChange: editable ? (next: unknown) => setEdited(next) : undefined,
    };
    switch (proposal.toolName) {
      case "propose_tailoring_strategy":
        return <ProposalCardTailoringStrategy {...shared} />;
      case "update_company_notes":
        return <ProposalCardCompanyNotes {...shared} />;
      case "save_brief":
        return <ProposalCardBrief {...shared} />;
      default:
        return (
          <pre className="text-small overflow-auto whitespace-pre-wrap">
            {JSON.stringify(content, null, 2)}
          </pre>
        );
    }
  };

  const headerActions = terminal ? (
    <span
      className={`text-label uppercase ${
        proposal.status === "approved" || proposal.status === "edited"
          ? "text-accent"
          : proposal.status === "errored"
            ? "text-danger"
            : "text-text-tertiary"
      }`}
    >
      {RESOLVED_LABEL[proposal.status]}
    </span>
  ) : (
    <span className="text-label uppercase text-text-secondary">Pending review</span>
  );

  return (
    <Card>
      <CardHeader title={title} actions={headerActions} />
      <CardBody className="flex flex-col gap-md">
        {renderBody(
          terminal ? proposal.resolvedContent ?? proposal.args : proposal.args,
          mode === "editing",
        )}
        {error && <p className="text-small text-danger">{error}</p>}
        {!terminal && (
          <div className="flex justify-end gap-sm">
            {mode === "editing" ? (
              <>
                <Button variant="ghost" type="button" onClick={() => setMode("pending")}>
                  Cancel edit
                </Button>
                <Button
                  type="button"
                  disabled={!edited}
                  onClick={() => void post("approve", { editedContent: edited })}
                >
                  Save & approve
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" type="button" onClick={() => void post("reject")}>
                  Reject
                </Button>
                <Button variant="secondary" type="button" onClick={() => setMode("editing")}>
                  Edit
                </Button>
                <Button type="button" onClick={() => void post("approve")}>
                  Approve
                </Button>
              </>
            )}
          </div>
        )}
        {proposal.status === "errored" && proposal.resolutionError && (
          <p className="text-small text-danger">{proposal.resolutionError}</p>
        )}
      </CardBody>
    </Card>
  );
}
