import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/agent/brain";
import { agentRunDb, logsDb } from "@/lib/db";

let agentRunning = false;

export async function POST(req: NextRequest) {
  if (agentRunning) {
    return NextResponse.json({ error: "Agent is already running" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const triggeredBy = body.triggeredBy || "dashboard";

  agentRunning = true;
  try {
    const result = await runAgent(triggeredBy);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  } finally {
    agentRunning = false;
  }
}

export async function GET() {
  const [latestRun, recentRuns, recentLogs] = await Promise.all([
    agentRunDb.getLatest(),
    agentRunDb.getRecent(5),
    logsDb.getRecent(20),
  ]);

  return NextResponse.json({
    isRunning: agentRunning,
    latestRun,
    recentRuns,
    recentLogs,
  });
}
