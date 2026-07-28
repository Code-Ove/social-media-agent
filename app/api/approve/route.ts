import { NextRequest, NextResponse } from "next/server";
import { contentDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, action } = body; // action = "approve" | "reject"

  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  if (action === "approve") {
    await contentDb.update(id, { status: "approved" });
    return NextResponse.json({ success: true, message: "Content approved and queued for publishing" });
  }

  if (action === "reject") {
    await contentDb.update(id, { status: "rejected" });
    return NextResponse.json({ success: true, message: "Content rejected and removed from queue" });
  }

  return NextResponse.json({ error: "Invalid action. Use approve or reject" }, { status: 400 });
}

export async function GET() {
  const [pending, approved, rejected] = await Promise.all([
    contentDb.getAll({ status: "pending_review" }),
    contentDb.getAll({ status: "approved" }),
    contentDb.getAll({ status: "rejected" }),
  ]);

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
