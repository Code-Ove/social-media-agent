// ============================================================
// A/B Testing Engine — generates multiple post variants per topic
// and tracks which style performs best over time
// ============================================================
import { generateContent } from "@/ai/router";
import { BRAND } from "@/lib/config";
import type { TrendingTopic } from "./trendFinder";

export interface ABVariant {
  id: string;
  hookStyle: "question" | "stat" | "story" | "controversial" | "listicle";
  label: string;
  text: string;
}

const HOOK_STYLES: ABVariant["hookStyle"][] = [
  "question",
  "stat",
  "story",
  "controversial",
  "listicle",
];

const HOOK_DESCRIPTIONS: Record<ABVariant["hookStyle"], string> = {
  question: "Open with a thought-provoking question to the audience",
  stat: "Open with a surprising statistic or data point",
  story: "Open with a short personal story or scenario",
  controversial: "Open with a slightly bold or contrarian opinion",
  listicle: "Open with a numbered list hook like '5 things...' or '3 mistakes...'",
};

// ── Generate 3 A/B variants for the same topic ───────────────
export async function generateABVariants(
  topic: TrendingTopic,
  platform: string,
  maxChars: number
): Promise<ABVariant[]> {
  // Pick 3 random hook styles
  const selectedStyles = [...HOOK_STYLES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3) as ABVariant["hookStyle"][];

  const variants: ABVariant[] = [];

  for (const hookStyle of selectedStyles) {
    const prompt = `You are a social media expert for ${BRAND.name}, a career platform for students.

Write a ${platform} post about: "${topic.topic}"
Content idea: ${topic.contentIdeas[0] || "Help students with their careers"}

HOOK STYLE: ${hookStyle.toUpperCase()} — ${HOOK_DESCRIPTIONS[hookStyle]}

Rules:
- Max ${maxChars} characters
- No hashtags (added separately)
- Make the hook the very first line — it must stop the scroll
- Write ONLY the post content, nothing else`;

    try {
      const text = await generateContent(prompt, "text");
      variants.push({
        id: `${hookStyle}-${Date.now()}`,
        hookStyle,
        label: hookStyle.charAt(0).toUpperCase() + hookStyle.slice(1),
        text,
      });
    } catch {
      // Skip failed variant
    }
  }

  return variants;
}

// ── Pick the winning variant (highest scoring based on engagement data) ──
export function pickBestVariant(variants: ABVariant[], engagementHistory?: Record<string, number>): ABVariant {
  if (!engagementHistory || variants.length === 0) {
    return variants[0];
  }

  // Score variants by historical hook style performance
  const scored = variants.map(v => ({
    variant: v,
    score: engagementHistory[v.hookStyle] || 5,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0].variant;
}
