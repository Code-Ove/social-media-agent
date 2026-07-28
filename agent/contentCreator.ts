// ============================================================
// Content Creator — generates all content types for all platforms
// ============================================================
import { generateContent, generateImageWithDallE } from "@/ai/router";
import { BRAND, PLATFORM_CONFIG, Platform, ContentType } from "@/lib/config";
import { logsDb, brandVoiceDb } from "@/lib/db";
import { v4 as uuid } from "uuid";
import type { TrendingTopic } from "./trendFinder";

export interface GeneratedContent {
  id: string;
  platform: Platform;
  type: ContentType;
  topic: string;
  textContent: string;
  imageUrl?: string;
  imagePrompt?: string;
  hashtags: string;
  aiProvider: string;
  scheduledAt: string;
}

// ── Main content generator ───────────────────────────────────
export async function createContent(
  topic: TrendingTopic,
  platform: Platform,
  contentType: ContentType,
  scheduledAt: Date,
  voiceStyle?: string
): Promise<GeneratedContent> {
  const log = (msg: string, level: "info" | "warn" | "error" | "success" | "debug" = "info") =>
    logsDb.insert({ id: uuid(), level, module: "contentCreator", message: msg });

  log(`Creating ${contentType} content for ${platform}: "${topic.topic}"`);

  // Get best brand voice for this platform (adaptive)
  const bestVoice = voiceStyle || (brandVoiceDb.getBestVoice(platform)?.voice_style) || "motivational";
  const platformCfg = PLATFORM_CONFIG[platform];

  let textContent = "";
  let imageUrl: string | undefined;
  let imagePrompt: string | undefined;
  let aiProvider = "simulation";

  try {
    // Generate text content
    textContent = await generateTextContent(topic, platform, contentType, bestVoice, platformCfg.maxCharacters);
    aiProvider = process.env.GEMINI_API_KEY ? "gemini" :
                 process.env.OPENAI_API_KEY ? "openai" :
                 process.env.ANTHROPIC_API_KEY ? "claude" : "simulation";

    // Generate image graphic based on selected topic
    imagePrompt = generateImagePrompt(topic, platform, bestVoice);
    if (process.env.OPENAI_API_KEY) {
      imageUrl = await generateImageWithDallE(imagePrompt);
    } else {
      const subtitle = topic.contentIdeas?.[0] || "InternCareerPath Daily Guidance";
      imageUrl = `/api/image?topic=${encodeURIComponent(topic.topic)}&platform=${encodeURIComponent(platform)}&subtitle=${encodeURIComponent(subtitle)}`;
    }
  } catch (err) {
    log(`Content creation error: ${err}`, "error");
    textContent = generateFallbackText(topic, platform, contentType, platformCfg.maxCharacters);
  }

  // Generate hashtags
  const hashtags = await generateHashtags(topic, platform, platformCfg.hashtagLimit);

  const content: GeneratedContent = {
    id: uuid(),
    platform,
    type: contentType,
    topic: topic.topic,
    textContent: textContent + "\n\n" + hashtags,
    imageUrl,
    imagePrompt,
    hashtags,
    aiProvider,
    scheduledAt: scheduledAt.toISOString(),
  };

  log(`Content created for ${platform}: ${topic.topic}`, "success");
  return content;
}

// ── Text generation per platform ─────────────────────────────
async function generateTextContent(
  topic: TrendingTopic,
  platform: Platform,
  contentType: ContentType,
  voiceStyle: string,
  maxChars: number
): Promise<string> {
  const platformGuidelines: Record<Platform, string> = {
    linkedin: "Professional, insightful, longer-form. Use paragraph breaks. Include a call-to-action. Add emojis sparingly.",
    instagram: "Visual storytelling, punchy, emotional. Short sentences. Use line breaks. Engaging first line (hook). Emojis encouraged.",
    twitter: `Ultra-concise (under ${maxChars} chars including hashtags). Punchy, provocative, or insightful. One clear message.`,
    facebook: "Conversational, community-building, ask questions. Medium length. Encourage comments and shares.",
    tiktok: "This is a video SCRIPT. Start with a hook. Use short punchy lines for on-screen text. TikTok-native language. 30-60 seconds read time.",
    youtube: "This is a YouTube Shorts SCRIPT (60 seconds). Hook in first 3 seconds. Clear value proposition. Strong CTA to subscribe.",
  };

  const voiceGuide: Record<string, string> = {
    motivational: "Inspiring, empowering, action-oriented. Use 'you can do this' energy. Focus on possibilities.",
    educational: "Informative, structured, authoritative. Use numbered lists and clear explanations.",
    conversational: "Friendly, relatable, casual. Like talking to a friend who happens to be an expert.",
    storytelling: "Narrative-driven, emotional, personal examples. Build connection through story.",
    professional: "Polished, authoritative, credibility-focused. Data and insights.",
  };

  const contentIdea = topic.contentIdeas[Math.floor(Math.random() * topic.contentIdeas.length)];

  const prompt = `You are a social media content creator for ${BRAND.name} — a platform for ${BRAND.niche} targeting ${BRAND.targetAudience}.

TOPIC: ${topic.topic}
CONTENT IDEA: ${contentIdea}
PLATFORM: ${platform.toUpperCase()}
CONTENT TYPE: ${contentType}
VOICE STYLE: ${voiceStyle} — ${voiceGuide[voiceStyle] || voiceGuide.motivational}

PLATFORM GUIDELINES:
${platformGuidelines[platform]}

REQUIREMENTS:
- Maximum ${maxChars} characters (STRICTLY enforce this)
- Do NOT include hashtags (they are added separately)
- Write in ${BRAND.contentLanguage}
- Match the voice style exactly
- Make it highly engaging and shareable

Write ONLY the post content. No explanations, no labels, just the content.`;

  return generateContent(prompt, "text");
}

// ── Image prompt generator ────────────────────────────────────
function generateImagePrompt(topic: TrendingTopic, platform: Platform, voiceStyle: string): string {
  const aspectRatio = platform === "twitter" ? "16:9" : "1:1";
  const style = voiceStyle === "educational" ? "clean infographic style" : "modern motivational poster style";

  return `Create a ${style} image about "${topic.topic}" for InternCareerPath social media. 
  Professional, modern design. Purple (#6366f1) and blue (#0ea5e9) color scheme. 
  Target audience: college students and early-career professionals. 
  ${aspectRatio} composition. Minimal text. High contrast. Premium quality.`;
}

// ── Hashtag generator ─────────────────────────────────────────
async function generateHashtags(topic: TrendingTopic, platform: Platform, limit: number): Promise<string> {
  const brandHashtags = ["#InternCareerPath", "#CareerTips"];
  const topicHashtags = topicToHashtags(topic.topic);
  const platformHashtags = platformSpecificHashtags(platform);

  const all = [...new Set([...brandHashtags, ...topicHashtags, ...platformHashtags])];
  return all.slice(0, limit).join(" ");
}

function topicToHashtags(topic: string): string[] {
  const map: Record<string, string[]> = {
    "AI": ["#AI", "#ArtificialIntelligence", "#Tech"],
    "Resume": ["#Resume", "#ResumeWriting", "#JobSearch"],
    "Interview": ["#Interview", "#InterviewPrep", "#JobTips"],
    "LinkedIn": ["#LinkedIn", "#LinkedInTips", "#Networking"],
    "Internship": ["#Internship", "#InternLife", "#Students"],
    "Career": ["#Career", "#CareerAdvice", "#ProfessionalGrowth"],
    "Salary": ["#SalaryNegotiation", "#Salary", "#Finance"],
    "Remote": ["#RemoteWork", "#WorkFromHome", "#Digital"],
    "Networking": ["#Networking", "#ProfessionalNetwork", "#Connections"],
    "Graduate": ["#FreshGraduate", "#GradLife", "#NewGrad"],
  };

  const hashtags: string[] = ["#Internship", "#CareerAdvice"];
  for (const [key, tags] of Object.entries(map)) {
    if (topic.toLowerCase().includes(key.toLowerCase())) {
      hashtags.push(...tags);
    }
  }
  return hashtags;
}

function platformSpecificHashtags(platform: Platform): string[] {
  const map: Record<Platform, string[]> = {
    linkedin: ["#ProfessionalDevelopment", "#LinkedInLearning"],
    instagram: ["#StudentLife", "#CollegeLife", "#GradLife"],
    twitter: ["#CareerTwitter", "#JobSearch"],
    facebook: ["#CareerAdvice", "#Students"],
    tiktok: ["#CareerTok", "#StudentTok", "#LearnOnTikTok"],
    youtube: ["#CareerAdvice", "#StudyWithMe"],
  };
  return map[platform] || [];
}

// ── Fallback content generator ────────────────────────────────
function generateFallbackText(topic: TrendingTopic, platform: Platform, type: ContentType, maxChars: number): string {
  const idea = topic.contentIdeas[0];

  const templates: Record<Platform, string> = {
    linkedin: `🚀 ${topic.topic}\n\n${idea}\n\nAt InternCareerPath, we believe every student deserves the tools to succeed. \n\nWhat's your biggest career challenge right now? Share below 👇`,
    instagram: `✨ ${topic.topic}\n\n${idea}\n\nSave this post for later! 📌\nTag someone who needs to see this 👇`,
    twitter: `💡 ${idea}\n\nRT if this helped you! 🔁`,
    facebook: `Hey InternCareerPath family! 👋\n\n${idea}\n\nShare your thoughts in the comments below! We'd love to hear from you. 💬`,
    tiktok: `[HOOK] Are you making this career mistake?\n\n[POINT 1] ${idea}\n\n[TRANSITION] But wait, there's more...\n\n[CTA] Follow for daily career tips! 🔔`,
    youtube: `[HOOK - 3 sec] Stop scrolling! This career tip will change everything.\n\n[VALUE] ${idea}\n\n[CTA] Subscribe for more career tips every day!`,
  };

  const content = templates[platform];
  return content.slice(0, maxChars);
}

// ── Carousel generator ────────────────────────────────────────
export async function createCarouselSlides(topic: TrendingTopic, platform: Platform): Promise<string[]> {
  const prompt = `Create a ${platform} carousel post about "${topic.topic}" for InternCareerPath.
  
  Generate 5-7 slides. For each slide provide:
  - A bold headline (max 10 words)
  - 2-3 bullet points of content
  
  Format as JSON: [{"headline": "...", "bullets": ["...", "...", "..."]}]
  
  Make it educational and actionable. Return ONLY valid JSON.`;

  try {
    const response = await generateContent(prompt, "text");
    const slides = JSON.parse(response);
    return slides.map((s: { headline: string; bullets: string[] }) =>
      `**${s.headline}**\n${s.bullets.map(b => `• ${b}`).join("\n")}`
    );
  } catch {
    return [
      `**${topic.topic}**\nEverything you need to know`,
      `**Why It Matters**\n• Career defining skill\n• High demand in 2025\n• Easy to learn`,
      `**Step 1: Get Started**\n• Start with basics\n• Practice daily\n• Track progress`,
      `**Step 2: Level Up**\n• Advanced techniques\n• Real projects\n• Build portfolio`,
      `**Take Action Today**\n• Start now\n• Follow InternCareerPath\n• Share with friends`,
    ];
  }
}
