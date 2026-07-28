import { NextRequest, NextResponse } from "next/server";
import { contentDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, action } = body; // action = "approve" | "reject"

  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  if (action === "approve") {
    contentDb.update(id, { status: "approved" });
    return NextResponse.json({ success: true, message: "Content approved and queued for publishing" });
  }

  if (action === "reject") {
    contentDb.update(id, { status: "rejected" });
    return NextResponse.json({ success: true, message: "Content rejected and removed from queue" });
  }

  return NextResponse.json({ error: "Invalid action. Use approve or reject" }, { status: 400 });
}

export async function GET() {
  const pending = contentDb.getAll({ status: "pending_review" });
  const approved = contentDb.getAll({ status: "approved" });
  const rejected = contentDb.getAll({ status: "rejected" });

  return NextResponse.json({
    pending,
    approved,
    rejected,
    counts: {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
    },
  });
}
