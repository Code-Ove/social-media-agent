import { NextRequest, NextResponse } from "next/server";
import { createCarouselSlides } from "@/agent/contentCreator";
import type { TrendingTopic } from "@/agent/trendFinder";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, platform = "linkedin" } = body;

    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const trendingTopic: TrendingTopic = {
      topic: topic,
      relevanceScore: 9,
      contentIdeas: [`Everything about ${topic}`, `Key tips for ${topic}`, `How to succeed at ${topic}`],
      suggestedPlatforms: [platform],
    };

    const slides = await createCarouselSlides(trendingTopic, platform as "linkedin" | "instagram");

    return NextResponse.json({
      topic,
      platform,
      slideCount: slides.length,
      slides,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
