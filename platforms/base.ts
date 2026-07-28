// ============================================================
// Platform Adapter — Abstract Base Interface
// ============================================================
export interface PostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

export interface Analytics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  impressions: number;
  clicks: number;
  engagementRate: number;
}

export interface PlatformAdapter {
  name: string;
  isConnected(): boolean;
  post(contentId: string): Promise<PostResult>;
  getAnalytics(postId: string): Promise<Analytics>;
}

// ── Simulation adapter (base for all platforms when not configured) ──
export class SimulationAdapter implements PlatformAdapter {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  isConnected(): boolean {
    return false;
  }

  async post(contentId: string): Promise<PostResult> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    return {
      success: true,
      postId: `sim_${this.name}_${contentId.slice(0, 8)}`,
      url: `https://simulation.interncareerpath.com/posts/${contentId}`,
    };
  }

  async getAnalytics(postId: string): Promise<Analytics> {
    // Return simulated analytics with realistic variation
    const base = Math.random() * 100;
    const engagement = (Math.random() * 5 + 1);
    return {
      likes: Math.floor(base * 1.5),
      comments: Math.floor(base * 0.3),
      shares: Math.floor(base * 0.2),
      views: Math.floor(base * 20),
      impressions: Math.floor(base * 25),
      clicks: Math.floor(base * 0.8),
      engagementRate: parseFloat(engagement.toFixed(2)),
    };
  }
}
