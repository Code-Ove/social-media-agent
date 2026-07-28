// ============================================================
// Database Layer — Supabase cloud Postgres (with JSON fallback)
// Uses the same API surface as the original JSON db
// ============================================================
export interface ContentItem {
  id: string;
  type: "text" | "image" | "carousel" | "video";
  platform: string;
  topic?: string;
  text_content?: string;
  image_url?: string;
  image_prompt?: string;
  hashtags?: string;
  status: "draft" | "pending_review" | "approved" | "scheduled" | "posted" | "failed" | "simulated" | "rejected";
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

// ── Supabase client factory (lazy, singleton) ─────────────────
let _supabase: ReturnType<typeof createSupabaseClient> | null = null;

function createSupabaseClient() {
  // Dynamic import so JSON fallback works without @supabase/supabase-js installed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getSupabase() {
  if (!_supabase) _supabase = createSupabaseClient();
  return _supabase;
}

function useSupabase() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// ── JSON fallback (original implementation) ───────────────────
const { join } = require("path");
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("fs");

const DATA_DIR = join(process.cwd(), "data");

interface DbSchema {
  content: ContentItem[];
  analytics: AnalyticsItem[];
  agent_logs: AgentLog[];
  platform_connections: PlatformConnection[];
  agent_runs: AgentRun[];
  brand_voice_metrics: BrandVoiceMetric[];
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
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
    writeFileSync(join(DATA_DIR, "agent.json"), JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(readFileSync(dbPath, "utf-8"));
}

function writeDb(data: DbSchema) {
  ensureDataDir();
  writeFileSync(join(DATA_DIR, "agent.json"), JSON.stringify(data, null, 2));
}

// ── Content queries ───────────────────────────────────────────
export const contentDb = {
  insert: async (content: Omit<ContentItem, "created_at" | "updated_at">) => {
    const now = new Date().toISOString();
    const item: ContentItem = { ...content, created_at: now, updated_at: now };
    if (useSupabase()) {
      await getSupabase().from("content").insert(item);
    } else {
      const db = readDb();
      db.content.push(item);
      writeDb(db);
    }
    return item;
  },

  getAll: async (filters?: { status?: string; platform?: string; limit?: number }): Promise<ContentItem[]> => {
    if (useSupabase()) {
      let query = getSupabase().from("content").select("*").order("created_at", { ascending: false });
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.platform) query = query.eq("platform", filters.platform);
      if (filters?.limit) query = query.limit(filters.limit);
      const { data } = await query;
      return data || [];
    }
    const db = readDb();
    let items = [...db.content];
    if (filters?.status) items = items.filter(i => i.status === filters.status);
    if (filters?.platform) items = items.filter(i => i.platform === filters.platform);
    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (filters?.limit) items = items.slice(0, filters.limit);
    return items;
  },

  getById: async (id: string): Promise<ContentItem | undefined> => {
    if (useSupabase()) {
      const { data } = await getSupabase().from("content").select("*").eq("id", id).single();
      return data || undefined;
    }
    return readDb().content.find(i => i.id === id);
  },

  updateStatus: async (id: string, status: string, postId?: string) => {
    const now = new Date().toISOString();
    if (useSupabase()) {
      const updates: Record<string, unknown> = { status, updated_at: now };
      if (postId) updates.post_id = postId;
      if (status === "posted") updates.posted_at = now;
      await getSupabase().from("content").update(updates).eq("id", id);
    } else {
      const db = readDb();
      const item = db.content.find(i => i.id === id);
      if (item) {
        item.status = status as ContentItem["status"];
        if (postId) item.post_id = postId;
        if (status === "posted") item.posted_at = now;
        item.updated_at = now;
      }
      writeDb(db);
    }
  },

  getDueForPosting: async (): Promise<ContentItem[]> => {
    const now = new Date().toISOString();
    if (useSupabase()) {
      const { data } = await getSupabase().from("content").select("*")
        .eq("status", "approved")
        .lte("scheduled_at", now);
      return data || [];
    }
    const db = readDb();
    return db.content.filter(i => i.status === "approved" && (i.scheduled_at || "") <= now);
  },

  delete: async (id: string) => {
    if (useSupabase()) {
      await getSupabase().from("content").delete().eq("id", id);
    } else {
      const db = readDb();
      db.content = db.content.filter(i => i.id !== id);
      writeDb(db);
    }
  },

  update: async (id: string, updates: Partial<ContentItem>) => {
    const now = new Date().toISOString();
    if (useSupabase()) {
      await getSupabase().from("content").update({ ...updates, updated_at: now }).eq("id", id);
    } else {
      const db = readDb();
      const idx = db.content.findIndex(i => i.id === id);
      if (idx !== -1) db.content[idx] = { ...db.content[idx], ...updates, updated_at: now };
      writeDb(db);
    }
  },
};

// ── Logs queries ──────────────────────────────────────────────
export const logsDb = {
  insert: async (log: Omit<AgentLog, "created_at">) => {
    const item: AgentLog = { ...log, created_at: new Date().toISOString() };
    if (useSupabase()) {
      await getSupabase().from("agent_logs").insert(item);
    } else {
      const db = readDb();
      db.agent_logs.push(item);
      if (db.agent_logs.length > 1000) db.agent_logs = db.agent_logs.slice(-1000);
      writeDb(db);
    }
    return item;
  },

  getRecent: async (limit = 50): Promise<AgentLog[]> => {
    if (useSupabase()) {
      const { data } = await getSupabase().from("agent_logs").select("*").order("created_at", { ascending: false }).limit(limit);
      return data || [];
    }
    return readDb().agent_logs.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  },

  getByLevel: async (level: string, limit = 20): Promise<AgentLog[]> => {
    if (useSupabase()) {
      const { data } = await getSupabase().from("agent_logs").select("*").eq("level", level).order("created_at", { ascending: false }).limit(limit);
      return data || [];
    }
    return readDb().agent_logs.filter(l => l.level === level).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  },
};

// ── Platform queries ──────────────────────────────────────────
export const platformDb = {
  getAll: async (): Promise<PlatformConnection[]> => {
    if (useSupabase()) {
      const { data } = await getSupabase().from("platform_connections").select("*");
      return data || [];
    }
    return readDb().platform_connections;
  },

  update: async (platform: string, data: Partial<PlatformConnection>) => {
    const now = new Date().toISOString();
    if (useSupabase()) {
      await getSupabase().from("platform_connections").upsert({ platform, ...data, updated_at: now });
    } else {
      const db = readDb();
      const idx = db.platform_connections.findIndex(p => p.platform === platform);
      if (idx !== -1) db.platform_connections[idx] = { ...db.platform_connections[idx], ...data, updated_at: now };
      writeDb(db);
    }
  },

  getStatus: async (platform: string) => {
    if (useSupabase()) {
      const { data } = await getSupabase().from("platform_connections").select("status").eq("platform", platform).single();
      return data ? { status: data.status } : undefined;
    }
    const conn = readDb().platform_connections.find(p => p.platform === platform);
    return conn ? { status: conn.status } : undefined;
  },
};

// ── Analytics queries ─────────────────────────────────────────
export const analyticsDb = {
  insert: async (analytics: Omit<AnalyticsItem, "fetched_at">) => {
    const item: AnalyticsItem = { ...analytics, fetched_at: new Date().toISOString() };
    if (useSupabase()) {
      await getSupabase().from("analytics").insert(item);
    } else {
      const db = readDb();
      db.analytics.push(item);
      writeDb(db);
    }
    return item;
  },

  getByPlatform: async (platform: string, days = 7): Promise<(AnalyticsItem & { type?: string; topic?: string; text_content?: string })[]> => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    if (useSupabase()) {
      const { data } = await getSupabase().from("analytics")
        .select("*, content(type, topic, text_content)")
        .eq("platform", platform)
        .gte("fetched_at", since)
        .order("engagement_rate", { ascending: false });
      return (data || []).map((a: Record<string, unknown>) => {
        const c = a.content as Record<string, unknown> | null;
        return { ...a, type: c?.type, topic: c?.topic, text_content: c?.text_content } as AnalyticsItem & { type?: string; topic?: string; text_content?: string };
      });
    }
    const db = readDb();
    return db.analytics
      .filter(a => a.platform === platform && a.fetched_at >= since)
      .sort((a, b) => b.engagement_rate - a.engagement_rate)
      .map(a => {
        const content = db.content.find(c => c.id === a.content_id);
        return { ...a, type: content?.type, topic: content?.topic, text_content: content?.text_content };
      });
  },

  getSummary: async () => {
    const platforms = ["linkedin", "instagram", "twitter", "facebook", "tiktok", "youtube"];
    if (useSupabase()) {
      const results = await Promise.all(platforms.map(async (platform) => {
        const { data } = await getSupabase().from("analytics").select("likes, comments, shares, views, engagement_rate").eq("platform", platform);
        const items = data || [];
        if (!items.length) return { platform, avg_engagement: 0, total_likes: 0, total_comments: 0, total_shares: 0, total_views: 0, total_posts: 0 };
        return {
          platform,
          avg_engagement: items.reduce((s: number, a: AnalyticsItem) => s + a.engagement_rate, 0) / items.length,
          total_likes: items.reduce((s: number, a: AnalyticsItem) => s + a.likes, 0),
          total_comments: items.reduce((s: number, a: AnalyticsItem) => s + a.comments, 0),
          total_shares: items.reduce((s: number, a: AnalyticsItem) => s + a.shares, 0),
          total_views: items.reduce((s: number, a: AnalyticsItem) => s + a.views, 0),
          total_posts: items.length,
        };
      }));
      return results;
    }
    const db = readDb();
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
  start: async (id: string, triggeredBy = "cron") => {
    const run: AgentRun = {
      id, status: "running", triggered_by: triggeredBy,
      content_generated: 0, content_posted: 0, errors: 0,
      started_at: new Date().toISOString(),
    };
    if (useSupabase()) {
      await getSupabase().from("agent_runs").insert(run);
    } else {
      const db = readDb();
      db.agent_runs.push(run);
      writeDb(db);
    }
    return run;
  },

  finish: async (id: string, stats: { contentGenerated: number; contentPosted: number; errors: number; status: string }) => {
    const now = new Date().toISOString();
    if (useSupabase()) {
      await getSupabase().from("agent_runs").update({
        status: stats.status,
        content_generated: stats.contentGenerated,
        content_posted: stats.contentPosted,
        errors: stats.errors,
        finished_at: now,
      }).eq("id", id);
    } else {
      const db = readDb();
      const run = db.agent_runs.find(r => r.id === id);
      if (run) {
        run.status = stats.status as AgentRun["status"];
        run.content_generated = stats.contentGenerated;
        run.content_posted = stats.contentPosted;
        run.errors = stats.errors;
        run.finished_at = now;
      }
      writeDb(db);
    }
  },

  getRecent: async (limit = 10): Promise<AgentRun[]> => {
    if (useSupabase()) {
      const { data } = await getSupabase().from("agent_runs").select("*").order("started_at", { ascending: false }).limit(limit);
      return data || [];
    }
    return readDb().agent_runs.sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, limit);
  },

  getLatest: async (): Promise<AgentRun | undefined> => {
    if (useSupabase()) {
      const { data } = await getSupabase().from("agent_runs").select("*").order("started_at", { ascending: false }).limit(1).single();
      return data || undefined;
    }
    return readDb().agent_runs.sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  },
};

// ── Brand voice queries ───────────────────────────────────────
export const brandVoiceDb = {
  upsert: async (data: Omit<BrandVoiceMetric, "updated_at">) => {
    const item: BrandVoiceMetric = { ...data, updated_at: new Date().toISOString() };
    if (useSupabase()) {
      await getSupabase().from("brand_voice_metrics").upsert(item);
    } else {
      const db = readDb();
      const idx = db.brand_voice_metrics.findIndex(b => b.id === data.id);
      if (idx !== -1) db.brand_voice_metrics[idx] = item;
      else db.brand_voice_metrics.push(item);
      writeDb(db);
    }
    return item;
  },

  getBestVoice: async (platform: string): Promise<BrandVoiceMetric | undefined> => {
    if (useSupabase()) {
      const { data } = await getSupabase().from("brand_voice_metrics")
        .select("*").eq("platform", platform).order("avg_engagement_rate", { ascending: false }).limit(1).single();
      return data || undefined;
    }
    return readDb().brand_voice_metrics
      .filter(b => b.platform === platform)
      .sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)[0];
  },

  getAll: async (): Promise<BrandVoiceMetric[]> => {
    if (useSupabase()) {
      const { data } = await getSupabase().from("brand_voice_metrics").select("*").order("avg_engagement_rate", { ascending: false });
      return data || [];
    }
    return readDb().brand_voice_metrics.sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate);
  },
};
