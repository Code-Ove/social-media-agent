// Instagram Platform Adapter (Meta Graph API)
import { SimulationAdapter, PlatformAdapter, PostResult, Analytics } from "./base";
import { contentDb } from "@/lib/db";
import axios from "axios";

class InstagramAdapter implements PlatformAdapter {
  name = "instagram";
  isConnected(): boolean {
    return !!(process.env.META_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID);
  }

  async post(contentId: string): Promise<PostResult> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).post(contentId);

    const content = await contentDb.getById(contentId) as { text_content: string; image_url?: string } | undefined;
    if (!content) return { success: false, error: "Content not found" };
    if (!content.image_url) return { success: false, error: "Instagram requires an image" };

    try {
      const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!;
      const token = process.env.META_ACCESS_TOKEN!;
      const base = `https://graph.facebook.com/v21.0`;

      // Step 1: Create media container
      const containerRes = await axios.post(`${base}/${accountId}/media`, {
        image_url: content.image_url,
        caption: content.text_content,
        access_token: token,
      });
      const containerId = containerRes.data?.id;

      // Step 2: Publish container
      const publishRes = await axios.post(`${base}/${accountId}/media_publish`, {
        creation_id: containerId,
        access_token: token,
      });

      const postId = publishRes.data?.id;
      return { success: true, postId, url: `https://instagram.com/p/${postId}` };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getAnalytics(postId: string): Promise<Analytics> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).getAnalytics(postId);
    try {
      const token = process.env.META_ACCESS_TOKEN!;
      const response = await axios.get(
        `https://graph.facebook.com/v21.0/${postId}/insights?metric=impressions,reach,likes,comments,shares&access_token=${token}`
      );
      const data = response.data?.data || [];
      const getValue = (name: string) => data.find((d: { name: string; values: { value: number }[] }) => d.name === name)?.values[0]?.value || 0;
      const likes = getValue("likes"), comments = getValue("comments");
      const shares = getValue("shares"), impressions = getValue("impressions");
      return {
        likes, comments, shares, views: impressions,
        impressions, clicks: 0,
        engagementRate: parseFloat(((likes + comments + shares) / Math.max(impressions, 1) * 100).toFixed(2)),
      };
    } catch { return new SimulationAdapter(this.name).getAnalytics(postId); }
  }
}
export default new InstagramAdapter();
