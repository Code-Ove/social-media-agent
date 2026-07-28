import { NextResponse } from "next/server";
import { analyticsDb, contentDb } from "@/lib/db";

export async function GET() {
  const [summary, recentContent, simulatedContent] = await Promise.all([
    analyticsDb.getSummary(),
    contentDb.getAll({ status: "posted", limit: 20 }),
    contentDb.getAll({ status: "simulated", limit: 20 }),
  ]);

  // Overall stats
  const totalPosts = summary.reduce((s, p) => s + p.total_posts, 0);
  const totalLikes = summary.reduce((s, p) => s + p.total_likes, 0);
  const totalComments = summary.reduce((s, p) => s + p.total_comments, 0);
  const totalShares = summary.reduce((s, p) => s + p.total_shares, 0);
  const totalViews = summary.reduce((s, p) => s + p.total_views, 0);
  const avgEngagement = summary.length
    ? summary.reduce((s, p) => s + p.avg_engagement, 0) / summary.length
    : 0;

  return NextResponse.json({
    summary,
    overall: { totalPosts, totalLikes, totalComments, totalShares, totalViews, avgEngagement },
    recentContent: [...recentContent, ...simulatedContent].slice(0, 20),
  });
}
