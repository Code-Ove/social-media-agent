// ============================================================
// AI Provider Router — picks best model per task
// ============================================================
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { AI_CONFIG } from "@/lib/config";

// ── Gemini ──────────────────────────────────────────────────
export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── OpenAI GPT-4 ────────────────────────────────────────────
export async function generateWithOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a social media content expert for InternCareerPath, a platform for career development and internships. Write engaging, professional content that resonates with college students and early-career professionals.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: AI_CONFIG.maxTokens,
    temperature: AI_CONFIG.temperature,
  });
  return completion.choices[0]?.message?.content ?? "";
}

// ── Claude ──────────────────────────────────────────────────
export async function generateWithClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: AI_CONFIG.maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

// ── DALL-E Image Generation ──────────────────────────────────
export async function generateImageWithDallE(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const client = new OpenAI({ apiKey });
  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: `Professional social media image for InternCareerPath (career development brand). ${prompt}. Modern, clean design with purple and blue color scheme. No text overlays.`,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });
  return response.data?.[0]?.url ?? "";
}

// ── Smart AI Router ─────────────────────────────────────────
export type TaskType = "text" | "image" | "trends" | "analysis" | "hashtags" | "strategy";

export async function generateContent(prompt: string, task: TaskType = "text"): Promise<string> {
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    // Simulation mode: return mock content
    return generateMockContent(task, prompt);
  }

  // Route to best provider per task type
  if (task === "image") {
    if (availableProviders.includes("openai")) {
      return generateImageWithDallE(prompt);
    }
    return "https://placehold.co/1024x1024/6366f1/white?text=InternCareerPath";
  }

  if (task === "analysis" && availableProviders.includes("claude")) {
    return generateWithClaude(prompt);
  }

  if (task === "trends" && availableProviders.includes("gemini")) {
    return generateWithGemini(prompt);
  }

  // Fallback cascade
  const primary = AI_CONFIG.textModel;
  if (availableProviders.includes(primary)) {
    if (primary === "gemini") return generateWithGemini(prompt);
    if (primary === "openai") return generateWithOpenAI(prompt);
    if (primary === "claude") return generateWithClaude(prompt);
  }

  if (availableProviders.includes("gemini")) return generateWithGemini(prompt);
  if (availableProviders.includes("openai")) return generateWithOpenAI(prompt);
  if (availableProviders.includes("claude")) return generateWithClaude(prompt);

  return generateMockContent(task, prompt);
}

function getAvailableProviders(): string[] {
  const providers: string[] = [];
  if (process.env.GEMINI_API_KEY) providers.push("gemini");
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.ANTHROPIC_API_KEY) providers.push("claude");
  return providers;
}

function generateMockContent(task: TaskType, prompt: string): string {
  const mockContents: Record<TaskType, string[]> = {
    text: [
      "🚀 Landing your dream internship starts with one step: preparation.\n\nHere's what top interns do differently:\n✅ They research the company deeply\n✅ They tailor every application\n✅ They follow up strategically\n\nYour dream career is closer than you think. Start today! 💪\n\n#InternCareerPath #CareerTips #Internship",
      "💡 Did you know? 85% of jobs are filled through networking.\n\nYou don't need a massive network — you need a genuine one.\n\nStart by:\n→ Connecting with professors\n→ Reaching out to alumni\n→ Attending virtual events\n\nOne connection can change everything! 🌟\n\n#Networking #CareerAdvice #ProfessionalGrowth",
      "📝 Your resume has 6 seconds to make an impression.\n\nMake it count:\n1. Lead with impact numbers\n2. Use action verbs\n3. Tailor for each role\n4. Keep it to one page\n\nNeed a review? Drop a comment below! 👇\n\n#Resume #JobSearch #CareerTips",
    ],
    image: ["https://placehold.co/1024x1024/6366f1/white?text=InternCareerPath"],
    trends: [
      JSON.stringify([
        {
          topic: "AI Skills for Entry-Level Jobs",
          relevanceScore: 9,
          contentIdeas: ["Top 5 AI tools every intern should know", "How to add AI skills to your resume", "ChatGPT prompts for work"],
          suggestedPlatforms: ["linkedin", "instagram", "twitter"],
        },
        {
          topic: "Remote Internship Success",
          relevanceScore: 8,
          contentIdeas: ["How to stand out in a remote internship", "Home office setup", "Virtual networking tips"],
          suggestedPlatforms: ["linkedin", "tiktok", "instagram"],
        },
        {
          topic: "Resume for Fresh Graduates",
          relevanceScore: 9,
          contentIdeas: ["One-page resume template", "Common resume mistakes", "Writing a resume with no experience"],
          suggestedPlatforms: ["linkedin", "instagram", "facebook"],
        },
      ]),
    ],
    analysis: [
      JSON.stringify({
        bestPerformingStyle: "motivational",
        avgEngagement: 3.5,
        recommendation: "Use motivational tone with actionable steps and emojis",
      }),
    ],
    hashtags: ["#InternCareerPath #CareerTips #Internship #JobSearch #Students"],
    strategy: ["Focus on educational content Monday-Wednesday, motivational content Thursday-Friday, and success stories on weekends."],
  };

  const options = mockContents[task];
  return options[Math.floor(Math.random() * options.length)];
}
