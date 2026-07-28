// YouTube Platform Adapter
import { SimulationAdapter, PlatformAdapter, PostResult, Analytics } from "./base";
import { contentDb } from "@/lib/db";
import axios from "axios";

class YouTubeAdapter implements PlatformAdapter {
  name = "youtube";
  isConnected(): boolean {
    return !!(process.env.YOUTUBE_ACCESS_TOKEN && process.env.YOUTUBE_CHANNEL_ID);
  }

  async post(contentId: string): Promise<PostResult> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).post(contentId);

    const content = contentDb.getById(contentId) as { text_content: string; topic: string } | undefined;
    if (!content) return { success: false, error: "Content not found" };

    try {
      // For YouTube Shorts: we save the video script and metadata
      // Actual video upload requires a multipart request with video file
      const response = await axios.post(
        "https://www.googleapis.com/youtube/v3/videos?part=snippet,status",
        {
          snippet: {
            title: content.topic.slice(0, 100),
            description: content.text_content,
            categoryId: "22",
            tags: ["career", "internship", "students", "InternCareerPath"],
          },
          status: { privacyStatus: "public", madeForKids: false },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.YOUTUBE_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      const postId = response.data?.id;
      return { success: true, postId, url: `https://youtube.com/watch?v=${postId}` };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getAnalytics(postId: string): Promise<Analytics> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).getAnalytics(postId);
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?id=${postId}&part=statistics`,
        { headers: { Authorization: `Bearer ${process.env.YOUTUBE_ACCESS_TOKEN}` } }
      );
      const stats = response.data?.items?.[0]?.statistics || {};
      const likes = parseInt(stats.likeCount || "0");
      const comments = parseInt(stats.commentCount || "0");
      const views = parseInt(stats.viewCount || "0");
      return {
        likes, comments, shares: 0, views,
        impressions: views, clicks: 0,
        engagementRate: parseFloat(((likes + comments) / Math.max(views, 1) * 100).toFixed(2)),
      };
    } catch { return new SimulationAdapter(this.name).getAnalytics(postId); }
  }
}
export default new YouTubeAdapter();
