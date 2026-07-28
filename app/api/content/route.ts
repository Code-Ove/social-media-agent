import { NextRequest, NextResponse } from "next/server";
import { contentDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const platform = searchParams.get("platform") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50");

  const content = await contentDb.getAll({ status, platform, limit });
  return NextResponse.json({ content, total: content.length });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await contentDb.delete(id);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await contentDb.update(id, updates);
  return NextResponse.json({ success: true });
}
