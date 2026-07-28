// Twitter/X Platform Adapter
import { SimulationAdapter, PlatformAdapter, PostResult, Analytics } from "./base";
import { contentDb } from "@/lib/db";
import axios from "axios";

class TwitterAdapter implements PlatformAdapter {
  name = "twitter";
  isConnected(): boolean {
    return !!(process.env.TWITTER_BEARER_TOKEN && process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN);
  }

  async post(contentId: string): Promise<PostResult> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).post(contentId);

    const content = contentDb.getById(contentId) as { text_content: string } | undefined;
    if (!content) return { success: false, error: "Content not found" };

    try {
      // Twitter API v2 OAuth 1.0a
      const tweetText = content.text_content.slice(0, 280);
      const response = await axios.post(
        "https://api.twitter.com/2/tweets",
        { text: tweetText },
        {
          headers: {
            Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      const postId = response.data?.data?.id;
      return { success: true, postId, url: `https://twitter.com/i/web/status/${postId}` };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getAnalytics(postId: string): Promise<Analytics> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).getAnalytics(postId);
    try {
      const response = await axios.get(
        `https://api.twitter.com/2/tweets/${postId}?tweet.fields=public_metrics`,
        { headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` } }
      );
      const m = response.data?.data?.public_metrics || {};
      return {
        likes: m.like_count || 0, comments: m.reply_count || 0,
        shares: m.retweet_count || 0, views: m.impression_count || 0,
        impressions: m.impression_count || 0, clicks: 0,
        engagementRate: parseFloat(((m.like_count + m.reply_count + m.retweet_count) / Math.max(m.impression_count, 1) * 100).toFixed(2)),
      };
    } catch { return new SimulationAdapter(this.name).getAnalytics(postId); }
  }
}
export default new TwitterAdapter();
