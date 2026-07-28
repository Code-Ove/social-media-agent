// ============================================================
// LinkedIn Platform Adapter
// ============================================================
import { SimulationAdapter, PlatformAdapter, PostResult, Analytics } from "./base";
import { contentDb } from "@/lib/db";
import axios from "axios";

class LinkedInAdapter implements PlatformAdapter {
  name = "linkedin";

  isConnected(): boolean {
    return !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_PERSON_ID);
  }

  async post(contentId: string): Promise<PostResult> {
    if (!this.isConnected()) {
      return new SimulationAdapter(this.name).post(contentId);
    }

    const content = contentDb.getById(contentId) as {
      text_content: string;
      image_url?: string;
      type: string;
    } | undefined;

    if (!content) return { success: false, error: "Content not found" };

    try {
      const personId = process.env.LINKEDIN_PERSON_ID!;
      const token = process.env.LINKEDIN_ACCESS_TOKEN!;

      const authorUrn = personId.startsWith("urn:li:")
        ? personId
        : personId.match(/^\d+$/)
        ? `urn:li:person:${personId}`
        : `urn:li:organization:${personId}`;

      const postBody: Record<string, unknown> = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content.text_content },
            shareMediaCategory: content.image_url ? "IMAGE" : "NONE",
            ...(content.image_url && {
              media: [{
                status: "READY",
                description: { text: "InternCareerPath" },
                media: content.image_url,
              }],
            }),
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      };

      const response = await axios.post("https://api.linkedin.com/v2/ugcPosts", postBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json",
        },
      });

      const postId = response.headers["x-restli-id"] || response.data?.id;
      return { success: true, postId, url: `https://linkedin.com/feed/update/${postId}` };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  async getAnalytics(postId: string): Promise<Analytics> {
    if (!this.isConnected()) {
      return new SimulationAdapter(this.name).getAnalytics(postId);
    }

    try {
      const token = process.env.LINKEDIN_ACCESS_TOKEN!;
      const response = await axios.get(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      const likes = data.likesSummary?.totalLikes || 0;
      const comments = data.commentsSummary?.totalFirstLevelComments || 0;
      const shares = data.sharesSummary?.totalShares || 0;
      const views = 0;

      return {
        likes, comments, shares, views,
        impressions: 0, clicks: 0,
        engagementRate: likes + comments + shares > 0 ? ((likes + comments + shares) / Math.max(views, 1)) * 100 : 0,
      };
    } catch {
      return new SimulationAdapter(this.name).getAnalytics(postId);
    }
  }
}

export default new LinkedInAdapter();
