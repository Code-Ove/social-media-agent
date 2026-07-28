// ============================================================
// Trend Finder — detects trending topics in career/internship niche
// ============================================================
import { generateContent } from "@/ai/router";
import { BRAND, CONTENT_TOPICS } from "@/lib/config";
import { logsDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export interface TrendingTopic {
  topic: string;
  relevanceScore: number;
  contentIdeas: string[];
  suggestedPlatforms: string[];
}

export async function findTrendingTopics(count = 10): Promise<TrendingTopic[]> {
  const log = (msg: string, level: "info" | "warn" | "error" | "success" | "debug" = "info") =>
    logsDb.insert({ id: uuid(), level, module: "trendFinder", message: msg });

  log("Starting trend analysis...");

  const prompt = `You are a social media trend analyst for ${BRAND.name}, a platform focused on ${BRAND.niche} for ${BRAND.targetAudience}.

Find ${count} trending topics right now in the career development and internship space. Consider:
- Current job market trends
- Viral career advice topics on LinkedIn, TikTok, Instagram
- Common struggles of ${BRAND.targetAudience}
- Seasonal opportunities (hiring seasons, exam times, graduation periods)

For each trend, provide:
1. The topic name (concise)
2. Relevance score (1-10)
3. 3 specific content ideas for this topic
4. Best platforms to post this on

Format as JSON array: [{"topic": "...", "relevanceScore": 8, "contentIdeas": ["idea1", "idea2", "idea3"], "suggestedPlatforms": ["linkedin", "instagram"]}]

Also consider these evergreen topics for our brand: ${CONTENT_TOPICS.slice(0, 5).join(", ")}

Return ONLY valid JSON, no markdown code blocks.`;

  try {
    const response = await generateContent(prompt, "trends");

    // Parse JSON response (handle both raw JSON and mock)
    let topics: TrendingTopic[];
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        topics = parsed.map((item: any) => {
          if (typeof item === "string") {
            return {
              topic: item,
              relevanceScore: 8,
              contentIdeas: [`Top tips regarding ${item}`, `How to master ${item}`, `Common mistakes in ${item}`],
              suggestedPlatforms: ["linkedin", "instagram", "twitter", "facebook"],
            };
          }
          return {
            topic: item.topic || "Career Growth",
            relevanceScore: item.relevanceScore || 8,
            contentIdeas: Array.isArray(item.contentIdeas) ? item.contentIdeas : ["Career advice"],
            suggestedPlatforms: Array.isArray(item.suggestedPlatforms) ? item.suggestedPlatforms : ["linkedin", "instagram"],
          };
        });
      } else {
        topics = generateFallbackTopics(count);
      }
    } catch {
      // If parsing fails, generate from static topics
      topics = generateFallbackTopics(count);
    }

    log(`Found ${topics.length} trending topics`, "success");
    return topics.slice(0, count);
  } catch (error) {
    log(`Trend finding failed: ${error}`, "error");
    return generateFallbackTopics(count);
  }
}

function generateFallbackTopics(count: number): TrendingTopic[] {
  const fallbacks: TrendingTopic[] = [
    {
      topic: "AI Skills for Entry-Level Jobs",
      relevanceScore: 9,
      contentIdeas: [
        "Top 5 AI tools every intern should know in 2025",
        "How to add AI skills to your resume",
        "ChatGPT prompts that will impress your manager",
      ],
      suggestedPlatforms: ["linkedin", "instagram", "twitter"],
    },
    {
      topic: "Remote Internship Success",
      relevanceScore: 8,
      contentIdeas: [
        "How to stand out in a remote internship",
        "Setting up your home office for professionalism",
        "Virtual networking tips that actually work",
      ],
      suggestedPlatforms: ["linkedin", "tiktok", "instagram"],
    },
    {
      topic: "Resume for Fresh Graduates",
      relevanceScore: 9,
      contentIdeas: [
        "One-page resume template for students (free download)",
        "Common resume mistakes that get you rejected",
        "How to write a resume with no experience",
      ],
      suggestedPlatforms: ["linkedin", "instagram", "facebook"],
    },
    {
      topic: "LinkedIn for Students",
      relevanceScore: 8,
      contentIdeas: [
        "LinkedIn profile checklist for students",
        "How to message recruiters on LinkedIn",
        "LinkedIn features you're not using (but should be)",
      ],
      suggestedPlatforms: ["linkedin", "twitter", "youtube"],
    },
    {
      topic: "Behavioral Interview Prep",
      relevanceScore: 7,
      contentIdeas: [
        "STAR method explained with examples",
        "Top 10 behavioral interview questions and answers",
        "How to prepare for interviews in 24 hours",
      ],
      suggestedPlatforms: ["youtube", "tiktok", "instagram"],
    },
    {
      topic: "Career Pivot for Gen Z",
      relevanceScore: 7,
      contentIdeas: [
        "Signs you're in the wrong internship",
        "How to change career paths as a student",
        "5 careers you can start without a degree",
      ],
      suggestedPlatforms: ["tiktok", "instagram", "twitter"],
    },
    {
      topic: "Salary Negotiation Tips",
      relevanceScore: 8,
      contentIdeas: [
        "How to negotiate your first salary (scripts included)",
        "Average internship salaries by industry 2025",
        "When to accept an offer vs negotiate",
      ],
      suggestedPlatforms: ["linkedin", "twitter", "instagram"],
    },
    {
      topic: "Personal Branding for Students",
      relevanceScore: 7,
      contentIdeas: [
        "Building your personal brand as a student",
        "How to showcase projects online",
        "Creating a portfolio that gets you hired",
      ],
      suggestedPlatforms: ["linkedin", "instagram", "youtube"],
    },
    {
      topic: "Tech Internship Applications",
      relevanceScore: 8,
      contentIdeas: [
        "How to get a tech internship with no experience",
        "Top tech companies hiring interns now",
        "Coding interview prep resources (free)",
      ],
      suggestedPlatforms: ["linkedin", "twitter", "youtube"],
    },
    {
      topic: "Work-Life Balance as an Intern",
      relevanceScore: 6,
      contentIdeas: [
        "How to avoid burnout in your first job",
        "Setting boundaries as a new employee",
        "Morning routines of successful young professionals",
      ],
      suggestedPlatforms: ["instagram", "tiktok", "facebook"],
    },
  ];

  return fallbacks.slice(0, count);
}
