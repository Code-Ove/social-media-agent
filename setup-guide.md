# InternCareerPath Social Media Agent — Setup & API Key Guide

This project is an **Autonomous AI Agent System** designed for **InternCareerPath**. It generates, schedules, and posts content across 6 major social platforms.

---

## Quick Start (Simulation Mode)

By default, the agent runs in **Simulation Mode** — it generates high-quality content using AI (or fallback simulation logic) and stores it in the local database (`data/agent.json`) without needing active social media API credentials.

To start the dashboard:
```bash
cd social-media-agent
npm run dev
```
Then open `http://localhost:3000` in your browser.

---

## Environment Variables Configuration

Create a `.env.local` file inside `social-media-agent/`:

```env
# ── AI API Keys (Add any one or all to activate real AI generation) ──
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here

# ── Social Media API Keys (Optional — required only for live posting) ──

# LinkedIn
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token
LINKEDIN_PERSON_ID=your_linkedin_person_or_org_id

# Instagram & Facebook (Meta Graph API)
META_ACCESS_TOKEN=your_meta_page_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_account_id
FACEBOOK_PAGE_ID=your_facebook_page_id

# Twitter / X
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_API_KEY=your_twitter_api_key
TWITTER_ACCESS_TOKEN=your_twitter_access_token

# TikTok
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token
TIKTOK_OPEN_ID=your_tiktok_open_id

# YouTube
YOUTUBE_ACCESS_TOKEN=your_youtube_oauth_token
YOUTUBE_CHANNEL_ID=your_youtube_channel_id
```

---

## Features Built-In

1. **AI Brain (`agent/brain.ts`)**:
   - Master orchestrator combining Trend Analysis, Content Planning, Content Creation, and Growth Intelligence.
2. **Multi-Platform Support (`platforms/`)**:
   - Platform-specific adapters for LinkedIn, Instagram, Twitter/X, Facebook, TikTok, and YouTube.
3. **Adaptive Brand Voice (`agent/growthAnalyzer.ts`)**:
   - Tracks engagement metrics per platform and automatically picks the best voice style (Motivational, Educational, Storytelling, Professional, Conversational).
4. **Rich Dashboard (`app/`)**:
   - **Home**: Live Agent Control Center, Real-Time Brain Logs, Quick Stats.
   - **Content Manager**: View, filter, preview, and delete generated posts.
   - **Calendar**: 7-day scheduled post planner.
   - **Analytics**: Cross-platform reach and engagement comparison.
   - **Settings**: Brand configuration and platform connection toggles.
