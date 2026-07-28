// ============================================================
// Master Brain — orchestrates all agent modules
// ============================================================
import { findTrendingTopics } from "./trendFinder";
import { createContent } from "./contentCreator";
import { generateABVariants, pickBestVariant } from "./abTester";
import { analyzeGrowth } from "./growthAnalyzer";
import { sendTelegramNotification } from "@/lib/telegram";
import { contentDb, logsDb, agentRunDb } from "@/lib/db";
import { AGENT_CONFIG, PLATFORM_CONFIG, POSTING_SCHEDULE, Platform, ContentType } from "@/lib/config";
import { v4 as uuid } from "uuid";

export interface AgentRunResult {
  runId: string;
  status: "completed" | "failed";
  contentGenerated: number;
  contentPosted: number;
  errors: number;
  insights?: ReturnType<typeof analyzeGrowth> extends Promise<infer T> ? T : never;
  startedAt: string;
  finishedAt: string;
}

// ── Main agent orchestration function ────────────────────────
export async function runAgent(triggeredBy = "cron"): Promise<AgentRunResult> {
  const runId = uuid();
  const startedAt = new Date().toISOString();
  let contentGenerated = 0;
  let errors = 0;

  agentRunDb.start(runId, triggeredBy);

  log("🧠 InternCareerPath Social Media Agent starting...", "info", "brain");
  log(`Run ID: ${runId} | Triggered by: ${triggeredBy}`, "info", "brain");

  try {
    // ── Step 1: Analyze growth & get voice recommendations ───
    log("📊 Step 1: Analyzing growth performance...", "info", "brain");
    const insights = await analyzeGrowth();
    log(`Growth analysis complete. Top platform: ${insights.topPerformingPlatform}`, "success", "brain");

    // ── Step 2: Find trending topics ─────────────────────────
    log("🔍 Step 2: Finding trending topics...", "info", "brain");
    const trends = await findTrendingTopics(AGENT_CONFIG.trendsToFetch);
    log(`Found ${trends.length} trending topics`, "success", "brain");

    // ── Step 3: Plan content for each enabled platform ───────
    log("📅 Step 3: Planning content for all platforms...", "info", "brain");
    const contentPlan = planContent(trends, insights);
    log(`Planned ${contentPlan.length} content pieces`, "info", "brain");

    // ── Step 4: Generate content ─────────────────────────────
    log("✍️ Step 4: Generating content...", "info", "brain");

    for (const plan of contentPlan.slice(0, AGENT_CONFIG.contentPerRun)) {
      try {
        const voiceRec = insights.recommendedVoices.find(v => v.platform === plan.platform);
        const voiceStyle = voiceRec?.recommendedVoice;
        const platformCfg = PLATFORM_CONFIG[plan.platform];

        // 🧪 A/B Test: Generate 3 variants and pick the best one
        log(`🧪 A/B Testing 3 hook styles for "${plan.trend.topic}" on ${plan.platform}...`, "info", "brain");
        const abVariants = await generateABVariants(plan.trend, plan.platform, platformCfg.maxCharacters);

        const content = await createContent(
          plan.trend,
          plan.platform,
          plan.contentType,
          plan.scheduledAt,
          voiceStyle
        );

        // Use A/B winner text if we got variants, otherwise use default
        const winnerVariant = abVariants.length > 0 ? pickBestVariant(abVariants) : null;
        const finalText = winnerVariant ? winnerVariant.text + "\n\n" + content.hashtags : content.textContent;

        // Save to database
        contentDb.insert({
          id: content.id,
          type: content.type,
          platform: content.platform,
          topic: content.topic,
          text_content: finalText,
          image_url: content.imageUrl || undefined,
          image_prompt: content.imagePrompt || undefined,
          hashtags: content.hashtags,
          status: "pending_review",
          scheduled_at: content.scheduledAt,
          ai_provider: content.aiProvider,
        });

        contentGenerated++;
        log(`✅ Generated ${content.type} for ${content.platform} [A/B: ${winnerVariant?.hookStyle || 'default'}]: "${content.topic}"`, "success", "brain");

        // Post immediately if simulation mode is off and scheduled time has passed
        if (!AGENT_CONFIG.simulationMode && new Date(content.scheduledAt) <= new Date()) {
          await postContent(content.id, content.platform);
        }
      } catch (err) {
        errors++;
        log(`❌ Failed to generate content: ${err}`, "error", "brain");
      }
    }

    // ── Step 5: Post any due content ─────────────────────────
    if (!AGENT_CONFIG.simulationMode) {
      log("📤 Step 5: Posting due content...", "info", "brain");
      const dueContent = contentDb.getDueForPosting() as Array<{ id: string; platform: string }>;
      for (const item of dueContent) {
        await postContent(item.id, item.platform as Platform);
      }
    } else {
      log("🔵 Simulation mode: Content saved as 'simulated' — not posted to real platforms", "info", "brain");
    }

    // ── Finalize ─────────────────────────────────────────────
    const result: AgentRunResult = {
      runId,
      status: "completed",
      contentGenerated,
      contentPosted: 0,
      errors,
      startedAt,
      finishedAt: new Date().toISOString(),
    };

    agentRunDb.finish(runId, {
      contentGenerated,
      contentPosted: 0,
      errors,
      status: "completed",
    });

    log(`🎉 Agent run completed! Generated: ${contentGenerated}, Errors: ${errors}`, "success", "brain");

    // Send Telegram alert if configured
    sendTelegramNotification(
      `🚀 <b>InternCareerPath Agent Run Completed!</b>\n\n` +
      `📝 <b>Content Generated:</b> ${contentGenerated} posts\n` +
      `⚠️ <b>Errors:</b> ${errors}\n` +
      `👁️ <b>Review Queue:</b> Action needed in dashboard!`
    ).catch(() => {});

    return result;
  } catch (error) {
    log(`💥 Agent run failed: ${error}`, "error", "brain");
    agentRunDb.finish(runId, { contentGenerated, contentPosted: 0, errors: errors + 1, status: "failed" });

    return {
      runId,
      status: "failed",
      contentGenerated,
      contentPosted: 0,
      errors: errors + 1,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }
}

// ── Content planning logic ────────────────────────────────────
function planContent(
  trends: Awaited<ReturnType<typeof findTrendingTopics>>,
  insights: Awaited<ReturnType<typeof analyzeGrowth>>
): Array<{ trend: (typeof trends)[0]; platform: Platform; contentType: ContentType; scheduledAt: Date }> {
  const plan: Array<{ trend: (typeof trends)[0]; platform: Platform; contentType: ContentType; scheduledAt: Date }> = [];
  const now = new Date();

  // Get enabled platforms
  const enabledPlatforms = Object.entries(PLATFORM_CONFIG)
    .filter(([, cfg]) => cfg.enabled)
    .map(([p]) => p as Platform);

  // Assign content to each platform
  for (const platform of enabledPlatforms) {
    const platformCfg = PLATFORM_CONFIG[platform];
    const schedule = POSTING_SCHEDULE[platform];
    const trendForPlatform = trends.find(t => t && Array.isArray(t.suggestedPlatforms) && t.suggestedPlatforms.includes(platform)) || trends[0];

    // Pick best content type for this platform
    const contentType = pickBestContentType(platform, platformCfg.contentTypes as ContentType[], insights);

    // Calculate next posting time
    const scheduledAt = getNextPostTime(now, schedule.preferredHours);

    plan.push({ trend: trendForPlatform, platform, contentType, scheduledAt });
  }

  return plan;
}

function pickBestContentType(
  platform: Platform,
  availableTypes: ContentType[],
  insights: Awaited<ReturnType<typeof analyzeGrowth>>
): ContentType {
  // Prefer highest-engagement type based on insights
  const preferredTypes: Record<Platform, ContentType[]> = {
    linkedin: ["carousel", "image", "text"],
    instagram: ["carousel", "image"],
    twitter: ["text", "image"],
    facebook: ["image", "carousel", "text"],
    tiktok: ["video"],
    youtube: ["video"],
  };

  const preferred = preferredTypes[platform];
  for (const type of preferred) {
    if (availableTypes.includes(type)) return type;
  }
  return availableTypes[0];
}

function getNextPostTime(from: Date, preferredHours: number[]): Date {
  const now = new Date(from);
  const currentHour = now.getHours();

  // Find next preferred hour today or tomorrow
  const nextHour = preferredHours.find(h => h > currentHour) || preferredHours[0];
  const scheduled = new Date(now);

  if (nextHour <= currentHour) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  scheduled.setHours(nextHour, 0, 0, 0);
  return scheduled;
}

// ── Post content to platform ──────────────────────────────────
async function postContent(contentId: string, platform: Platform): Promise<void> {
  try {
    // Dynamic import of platform adapter
    const adapter = await import(`@/platforms/${platform}`);
    const result = await adapter.default.post(contentId);

    if (result.success) {
      contentDb.updateStatus(contentId, "posted", result.postId);
      log(`Posted to ${platform}: ${result.postId}`, "success", "brain");
    } else {
      contentDb.updateStatus(contentId, "failed");
      log(`Failed to post to ${platform}: ${result.error}`, "error", "brain");
    }
  } catch (err) {
    contentDb.updateStatus(contentId, "failed");
    log(`Error posting to ${platform}: ${err}`, "error", "brain");
  }
}

// ── Helper logger ─────────────────────────────────────────────
function log(message: string, level: "info" | "warn" | "error" | "success" | "debug" = "info", module = "brain") {
  logsDb.insert({ id: uuid(), level, module, message });
  console.log(`[${level.toUpperCase()}][${module}] ${message}`);
}

export { log as agentLog };
