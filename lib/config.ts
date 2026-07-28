// ============================================================
// Central Configuration for InternCareerPath Social Media Agent
// ============================================================

export const BRAND = {
  name: "InternCareerPath",
  niche: "career development, internships, and professional growth",
  targetAudience: "college students, recent graduates, and early-career professionals",
  contentLanguage: "English",
  defaultHashtags: [
    "#InternCareerPath", "#CareerTips", "#Internship", "#JobSearch",
    "#CareerAdvice", "#ProfessionalGrowth", "#Students", "#GradLife",
  ],
};

export const POSTING_SCHEDULE = {
  // Posts per day per platform (configurable)
  linkedin: { postsPerDay: 1, preferredHours: [9, 12, 17] },
  instagram: { postsPerDay: 1, preferredHours: [10, 13, 18] },
  twitter: { postsPerDay: 1, preferredHours: [8, 12, 16, 20] },
  facebook: { postsPerDay: 1, preferredHours: [10, 15, 19] },
};

export const PLATFORM_CONFIG = {
  linkedin: {
    enabled: true,
    contentTypes: ["text", "image", "carousel"],
    maxCharacters: 3000,
    hashtagLimit: 5,
  },
  instagram: {
    enabled: true,
    contentTypes: ["image", "carousel"],
    maxCharacters: 2200,
    hashtagLimit: 30,
  },
  twitter: {
    enabled: true,
    contentTypes: ["text", "image"],
    maxCharacters: 280,
    hashtagLimit: 3,
  },
  facebook: {
    enabled: true,
    contentTypes: ["text", "image", "carousel"],
    maxCharacters: 63206,
    hashtagLimit: 10,
  },
};

export const AI_CONFIG = {
  // Primary model for text generation
  textModel: "gemini" as "gemini" | "openai" | "claude",
  // Primary model for image generation
  imageModel: "openai" as "openai" | "gemini",
  // Content safety filter level
  safetyLevel: "standard" as "strict" | "standard" | "relaxed",
  // Max tokens per content generation
  maxTokens: 2048,
  // Temperature for creativity (0=focused, 1=creative)
  temperature: 0.75,
  // Daily API cost limit in USD
  dailyCostLimitUSD: 5.0,
};

export const AGENT_CONFIG = {
  // Run agent automatically on this cron schedule (every 6 hours)
  cronSchedule: "0 */6 * * *",
  // Simulation mode: generate content but DON'T actually post
  simulationMode: true,
  // How many trending topics to find per run
  trendsToFetch: 10,
  // How many content pieces to generate per run
  contentPerRun: 6,
  // Days to look back for analytics performance data
  analyticsLookbackDays: 7,
  // Min engagement rate to consider a content type "successful" (%)
  successEngagementRate: 2.0,
};

export const CONTENT_TOPICS = [
  "internship tips and how to land your first internship",
  "resume writing tips for students",
  "interview preparation and common questions",
  "LinkedIn profile optimization for students",
  "networking tips for college students",
  "how to negotiate salary as a fresh graduate",
  "career paths and job market trends",
  "productivity tips for working professionals",
  "work-life balance for young professionals",
  "skills to learn for career growth",
  "how to ace virtual interviews",
  "building a personal brand online",
  "cover letter tips and examples",
  "transitioning from college to corporate life",
  "freelancing vs full-time employment",
];

export type Platform = keyof typeof PLATFORM_CONFIG;
export type ContentType = "text" | "image" | "carousel" | "video";
export type ContentStatus = "draft" | "scheduled" | "posted" | "failed" | "simulated";
export type AIProvider = "gemini" | "openai" | "claude";
