// ============================================================
// Database Layer — JSON file-based storage using lowdb
// No native compilation required — works on all platforms
// ============================================================
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { v4 as uuid } from "uuid";

// ── Types ─────────────────────────────────────────────────────
export interface ContentItem {
  id: string;
  type: "text" | "image" | "carousel" | "video";
  platform: string;
  topic?: string;
  text_content?: string;
  image_url?: string;
  image_prompt?: string;
  hashtags?: string;
  status: "draft" | "scheduled" | "posted" | "failed" | "simulated";
  scheduled_at?: string;
  posted_at?: string;
  post_id?: string;
  ai_provider?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsItem {
  id: string;
  content_id: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  impressions: number;
  clicks: number;
  engagement_rate: number;
  fetched_at: string;
}

export interface AgentLog {
  id: string;
  level: "info" | "warn" | "error" | "success" | "debug";
  module?: string;
  message: string;
  metadata?: string;
  created_at: string;
}

export interface PlatformConnection {
  platform: string;
  status: "connected" | "disconnected" | "error" | "simulation";
  access_token?: string;
  refresh_token?: string;
  page_id?: string;
  expires_at?: string;
  follower_count: number;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  status: "running" | "completed" | "failed";
  triggered_by: string;
  content_generated: number;
  content_posted: number;
  errors: number;
  started_at: string;
  finished_at?: string;
}

export interface BrandVoiceMetric {
  id: string;
  voice_style: string;
  avg_engagement_rate: number;
  total_posts: number;
  platform: string;
  updated_at: string;
}

interface DbSchema {
  content: ContentItem[];
  analytics: AnalyticsItem[];
  agent_logs: AgentLog[];
  platform_connections: PlatformConnection[];
  agent_runs: AgentRun[];
  brand_voice_metrics: BrandVoiceMetric[];
}

// ── Simple JSON DB implementation ────────────────────────────
const DATA_DIR = join(process.cwd(), "data");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDb(): DbSchema {
  ensureDataDir();
  const dbPath = join(DATA_DIR, "agent.json");
  if (!existsSync(dbPath)) {
    const initial: DbSchema = {
      content: [],
      analytics: [],
      agent_logs: [],
      platform_connections: [
        { platform: "linkedin", status: "simulation", follower_count: 0, updated_at: new Date().toISOString() },
        { platform: "instagram", status: "simulation", follower_count: 0, updated_at: new Date().toISOString() },
        { platform: "twitter", status: "simulation", follower_count: 0, updated_at: new Date().toISOString() },
        { platform: "facebook", status: "simulation", follower_count: 0, updated_at: new Date().toISOString() },
        { platform: "tiktok", status: "simulation", follower_count: 0, updated_at: new Date().toISOString() },
        { platform: "youtube", status: "simulation", follower_count: 0, updated_at: new Date().toISOString() },
      ],
      agent_runs: [],
      brand_voice_metrics: [],
    };
    writeDb(initial);
    return initial;
  }
  const { readFileSync } = require("fs");
  return JSON.parse(readFileSync(dbPath, "utf-8"));
}

function writeDb(data: DbSchema) {
  ensureDataDir();
  const { writeFileSync } = require("fs");
  writeFileSync(join(DATA_DIR, "agent.json"), JSON.stringify(data, null, 2));
}

// ── Content queries ───────────────────────────────────────────
export const contentDb = {
  insert: (content: Omit<ContentItem, "created_at" | "updated_at">) => {
    const db = readDb();
    const now = new Date().toISOString();
    const item: ContentItem = { ...content, created_at: now, updated_at: now };
    db.content.push(item);
    writeDb(db);
    return item;
  },
  getAll: (filters?: { status?: string; platform?: string; limit?: number }): ContentItem[] => {
    const db = readDb();
    let items = [...db.content];
    if (filters?.status) items = items.filter(i => i.status === filters.status);
    if (filters?.platform) items = items.filter(i => i.platform === filters.platform);
    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (filters?.limit) items = items.slice(0, filters.limit);
    return items;
  },
  getById: (id: string): ContentItem | undefined => {
    return readDb().content.find(i => i.id === id);
  },
  updateStatus: (id: string, status: string, postId?: string) => {
    const db = readDb();
    const now = new Date().toISOString();
    const item = db.content.find(i => i.id === id);
    if (item) {
      item.status = status as ContentItem["status"];
      if (postId) item.post_id = postId;
      if (status === "posted") item.posted_at = now;
      item.updated_at = now;
    }
    writeDb(db);
  },
  getDueForPosting: (): ContentItem[] => {
    const db = readDb();
    const now = new Date().toISOString();
    return db.content.filter(i => i.status === "scheduled" && (i.scheduled_at || "") <= now);
  },
  delete: (id: string) => {
    const db = readDb();
    db.content = db.content.filter(i => i.id !== id);
    writeDb(db);
  },
  update: (id: string, updates: Partial<ContentItem>) => {
    const db = readDb();
    const idx = db.content.findIndex(i => i.id === id);
    if (idx !== -1) {
      db.content[idx] = { ...db.content[idx], ...updates, updated_at: new Date().toISOString() };
    }
    writeDb(db);
  },
};

// ── Logs queries ──────────────────────────────────────────────
export const logsDb = {
  insert: (log: Omit<AgentLog, "created_at">) => {
    const db = readDb();
    const item: AgentLog = { ...log, created_at: new Date().toISOString() };
    db.agent_logs.push(item);
    // Keep only last 1000 logs
    if (db.agent_logs.length > 1000) db.agent_logs = db.agent_logs.slice(-1000);
    writeDb(db);
    return item;
  },
  getRecent: (limit = 50): AgentLog[] => {
    return readDb().agent_logs.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  },
  getByLevel: (level: string, limit = 20): AgentLog[] => {
    return readDb().agent_logs.filter(l => l.level === level).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  },
};

// ── Platform queries ──────────────────────────────────────────
export const platformDb = {
  getAll: (): PlatformConnection[] => readDb().platform_connections,
  update: (platform: string, data: Partial<PlatformConnection>) => {
    const db = readDb();
    const idx = db.platform_connections.findIndex(p => p.platform === platform);
    if (idx !== -1) {
      db.platform_connections[idx] = { ...db.platform_connections[idx], ...data, updated_at: new Date().toISOString() };
    }
    writeDb(db);
  },
  getStatus: (platform: string) => {
    const conn = readDb().platform_connections.find(p => p.platform === platform);
    return conn ? { status: conn.status } : undefined;
  },
};

// ── Analytics queries ─────────────────────────────────────────
export const analyticsDb = {
  insert: (analytics: Omit<AnalyticsItem, "fetched_at">) => {
    const db = readDb();
    const item: AnalyticsItem = { ...analytics, fetched_at: new Date().toISOString() };
    db.analytics.push(item);
    writeDb(db);
    return item;
  },
  getByPlatform: (platform: string, days = 7): (AnalyticsItem & { type?: string; topic?: string; text_content?: string })[] => {
    const db = readDb();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return db.analytics
      .filter(a => a.platform === platform && a.fetched_at >= since)
      .sort((a, b) => b.engagement_rate - a.engagement_rate)
      .map(a => {
        const content = db.content.find(c => c.id === a.content_id);
        return { ...a, type: content?.type, topic: content?.topic, text_content: content?.text_content };
      });
  },
  getSummary: () => {
    const db = readDb();
    const platforms = ["linkedin", "instagram", "twitter", "facebook", "tiktok", "youtube"];
    return platforms.map(platform => {
      const items = db.analytics.filter(a => a.platform === platform);
      if (!items.length) return { platform, avg_engagement: 0, total_likes: 0, total_comments: 0, total_shares: 0, total_views: 0, total_posts: 0 };
      return {
        platform,
        avg_engagement: items.reduce((s, a) => s + a.engagement_rate, 0) / items.length,
        total_likes: items.reduce((s, a) => s + a.likes, 0),
        total_comments: items.reduce((s, a) => s + a.comments, 0),
        total_shares: items.reduce((s, a) => s + a.shares, 0),
        total_views: items.reduce((s, a) => s + a.views, 0),
        total_posts: items.length,
      };
    });
  },
};

// ── Agent run queries ─────────────────────────────────────────
export const agentRunDb = {
  start: (id: string, triggeredBy = "cron") => {
    const db = readDb();
    const run: AgentRun = {
      id, status: "running", triggered_by: triggeredBy,
      content_generated: 0, content_posted: 0, errors: 0,
      started_at: new Date().toISOString(),
    };
    db.agent_runs.push(run);
    writeDb(db);
    return run;
  },
  finish: (id: string, stats: { contentGenerated: number; contentPosted: number; errors: number; status: string }) => {
    const db = readDb();
    const run = db.agent_runs.find(r => r.id === id);
    if (run) {
      run.status = stats.status as AgentRun["status"];
      run.content_generated = stats.contentGenerated;
      run.content_posted = stats.contentPosted;
      run.errors = stats.errors;
      run.finished_at = new Date().toISOString();
    }
    writeDb(db);
  },
  getRecent: (limit = 10): AgentRun[] => {
    return readDb().agent_runs.sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, limit);
  },
  getLatest: (): AgentRun | undefined => {
    return readDb().agent_runs.sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  },
};

// ── Brand voice queries ───────────────────────────────────────
export const brandVoiceDb = {
  upsert: (data: Omit<BrandVoiceMetric, "updated_at">) => {
    const db = readDb();
    const idx = db.brand_voice_metrics.findIndex(b => b.id === data.id);
    const item: BrandVoiceMetric = { ...data, updated_at: new Date().toISOString() };
    if (idx !== -1) {
      db.brand_voice_metrics[idx] = item;
    } else {
      db.brand_voice_metrics.push(item);
    }
    writeDb(db);
    return item;
  },
  getBestVoice: (platform: string): BrandVoiceMetric | undefined => {
    return readDb().brand_voice_metrics
      .filter(b => b.platform === platform)
      .sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)[0];
  },
  getAll: (): BrandVoiceMetric[] => {
    return readDb().brand_voice_metrics.sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate);
  },
};
