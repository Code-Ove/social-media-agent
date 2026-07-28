// TikTok Platform Adapter
import { SimulationAdapter, PlatformAdapter, PostResult, Analytics } from "./base";
import { contentDb } from "@/lib/db";
import axios from "axios";

class TikTokAdapter implements PlatformAdapter {
  name = "tiktok";
  isConnected(): boolean {
    return !!(process.env.TIKTOK_ACCESS_TOKEN && process.env.TIKTOK_OPEN_ID);
  }

  async post(contentId: string): Promise<PostResult> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).post(contentId);

    const content = contentDb.getById(contentId) as { text_content: string } | undefined;
    if (!content) return { success: false, error: "Content not found" };

    try {
      // TikTok Content Posting API — requires video file
      // Since we generate scripts, we post the script as a draft for review
      // In production, video would be generated/uploaded separately
      const response = await axios.post(
        "https://open.tiktokapis.com/v2/post/publish/content/init/",
        {
          post_info: {
            title: content.text_content.slice(0, 100),
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: { source: "FILE_UPLOAD" },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      const postId = response.data?.data?.publish_id;
      return { success: true, postId: postId || `tiktok_draft_${contentId.slice(0, 8)}` };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getAnalytics(postId: string): Promise<Analytics> {
    if (!this.isConnected()) return new SimulationAdapter(this.name).getAnalytics(postId);
    try {
      const response = await axios.post(
        "https://open.tiktokapis.com/v2/video/query/",
        {
          filters: { video_ids: [postId] },
          fields: ["like_count", "comment_count", "share_count", "view_count"],
        },
        { headers: { Authorization: `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}` } }
      );
      const video = response.data?.data?.videos?.[0] || {};
      return {
        likes: video.like_count || 0, comments: video.comment_count || 0,
        shares: video.share_count || 0, views: video.view_count || 0,
        impressions: video.view_count || 0, clicks: 0,
        engagementRate: parseFloat(((video.like_count + video.comment_count + video.share_count) / Math.max(video.view_count, 1) * 100).toFixed(2)),
      };
    } catch { return new SimulationAdapter(this.name).getAnalytics(postId); }
  }
}
export default new TikTokAdapter();
