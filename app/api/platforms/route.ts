import { NextResponse } from "next/server";
import { platformDb, analyticsDb } from "@/lib/db";

export async function GET() {
  const [connections, summary] = await Promise.all([
    platformDb.getAll(),
    analyticsDb.getSummary(),
  ]);

  const platforms = connections.map(conn => {
    const analytics = summary.find(s => s.platform === conn.platform);
    return {
      ...conn,
      analytics: analytics || { avg_engagement: 0, total_likes: 0, total_posts: 0 },
    };
  });

  return NextResponse.json({ platforms });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { platform, ...updates } = body;
  if (!platform) return NextResponse.json({ error: "Platform required" }, { status: 400 });

  await platformDb.update(platform, updates);
  return NextResponse.json({ success: true });
}
