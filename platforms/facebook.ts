// Facebook Platform Adapter (Meta Graph API)
import { SimulationAdapter, PlatformAdapter, PostResult, Analytics } from "./base";
import { contentDb } from "@/lib/db";
import axios from "axios";

class FacebookAdapter implements PlatformAdapter {
  name = "facebook";
  isConnected(): boolean {
    return !!(process.env.META_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID);
  }

  async post(contentId: string): Promise<PostResult> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).post(contentId);

    const content = contentDb.getById(contentId) as { text_content: string; image_url?: string } | undefined;
    if (!content) return { success: false, error: "Content not found" };

    try {
      const pageId = process.env.FACEBOOK_PAGE_ID!;
      const token = process.env.META_ACCESS_TOKEN!;
      const endpoint = content.image_url ? "photos" : "feed";

      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${pageId}/${endpoint}`,
        {
          message: content.text_content,
          ...(content.image_url && { url: content.image_url }),
          access_token: token,
        }
      );
      const postId = response.data?.id;
      return { success: true, postId, url: `https://facebook.com/${postId}` };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getAnalytics(postId: string): Promise<Analytics> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).getAnalytics(postId);
    try {
      const token = process.env.META_ACCESS_TOKEN!;
      const response = await axios.get(
        `https://graph.facebook.com/v21.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${token}`
      );
      const data = response.data;
      const likes = data.likes?.summary?.total_count || 0;
      const comments = data.comments?.summary?.total_count || 0;
      const shares = data.shares?.count || 0;
      return { likes, comments, shares, views: 0, impressions: 0, clicks: 0, engagementRate: parseFloat(((likes + comments + shares) / 100).toFixed(2)) };
    } catch { return new SimulationAdapter(this.name).getAnalytics(postId); }
  }
}
export default new FacebookAdapter();
