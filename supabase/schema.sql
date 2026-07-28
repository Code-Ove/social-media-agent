-- ============================================================
-- Supabase SQL Schema for InternCareerPath Social Media Agent
-- Run this in Supabase SQL Editor → https://supabase.com/dashboard
-- ============================================================

-- Content table
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'carousel', 'video')),
  platform TEXT NOT NULL,
  topic TEXT,
  text_content TEXT,
  image_url TEXT,
  image_prompt TEXT,
  hashtags TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'scheduled', 'posted', 'failed', 'simulated', 'rejected')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  post_id TEXT,
  ai_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  content_id TEXT REFERENCES content(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent logs table
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'success', 'debug')),
  module TEXT,
  message TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform connections table
CREATE TABLE IF NOT EXISTS platform_connections (
  platform TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'simulation',
  access_token TEXT,
  refresh_token TEXT,
  page_id TEXT,
  expires_at TIMESTAMPTZ,
  follower_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent runs table
CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'running',
  triggered_by TEXT DEFAULT 'cron',
  content_generated INTEGER DEFAULT 0,
  content_posted INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Brand voice metrics table
CREATE TABLE IF NOT EXISTS brand_voice_metrics (
  id TEXT PRIMARY KEY,
  voice_style TEXT NOT NULL,
  avg_engagement_rate FLOAT DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  platform TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default platform connections
INSERT INTO platform_connections (platform, status, follower_count, updated_at)
VALUES
  ('linkedin',  'simulation', 0, NOW()),
  ('instagram', 'simulation', 0, NOW()),
  ('twitter',   'simulation', 0, NOW()),
  ('facebook',  'simulation', 0, NOW()),
  ('tiktok',    'simulation', 0, NOW()),
  ('youtube',   'simulation', 0, NOW())
ON CONFLICT (platform) DO NOTHING;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voice_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (server-side API uses service key)
CREATE POLICY "Service role full access" ON content FOR ALL USING (true);
CREATE POLICY "Service role full access" ON analytics FOR ALL USING (true);
CREATE POLICY "Service role full access" ON agent_logs FOR ALL USING (true);
CREATE POLICY "Service role full access" ON agent_runs FOR ALL USING (true);
CREATE POLICY "Service role full access" ON brand_voice_metrics FOR ALL USING (true);
CREATE POLICY "Service role full access" ON platform_connections FOR ALL USING (true);
