// ============================================================
// Agent Scheduler — manages cron jobs for automated posting
// ============================================================
import cron from "node-cron";
import { runAgent } from "./brain";
import { AGENT_CONFIG } from "@/lib/config";
import { logsDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

let schedulerStarted = false;
let cronJob: cron.ScheduledTask | null = null;

export function startScheduler() {
  if (schedulerStarted) {
    console.log("[Scheduler] Already running");
    return;
  }

  const schedule = AGENT_CONFIG.cronSchedule;
  console.log(`[Scheduler] Starting with schedule: ${schedule}`);

  cronJob = cron.schedule(schedule, async () => {
    console.log("[Scheduler] Running scheduled agent...");
    logsDb.insert({
      id: uuid(),
      level: "info",
      module: "scheduler",
      message: `Cron triggered agent run (schedule: ${schedule})`,
    });
    await runAgent("cron");
  });

  schedulerStarted = true;
  logsDb.insert({
    id: uuid(),
    level: "success",
    module: "scheduler",
    message: `Scheduler started with schedule: ${schedule}`,
  });

  console.log("[Scheduler] ✅ Running");
}

export function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    schedulerStarted = false;
    logsDb.insert({
      id: uuid(),
      level: "info",
      module: "scheduler",
      message: "Scheduler stopped",
    });
    console.log("[Scheduler] Stopped");
  }
}

export function isSchedulerRunning(): boolean {
  return schedulerStarted;
}
