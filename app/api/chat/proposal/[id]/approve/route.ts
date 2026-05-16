import { NextResponse } from "next/server";
import { approveProposal } from "@/lib/chat/proposals";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: { editedContent?: unknown } = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await approveProposal(id, body.editedContent);
  if (!result.ok) {
    const status =
      result.error.code === "NOT_FOUND"
        ? 404
        : result.error.code === "VALIDATION_FAILED"
          ? 422
          : 500;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ proposal: result.data });
}
