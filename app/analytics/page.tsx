"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface PlatformAnalytics {
  platform: string;
  avg_engagement: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_views: number;
  total_posts: number;
}

interface OverallStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  avgEngagement: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<PlatformAnalytics[]>([]);
  const [overall, setOverall] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary || []);
          setOverall(data.overall || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  return (
    <DashboardLayout>
      <div className="card fade-in" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Growth & Brand Performance Analytics</div>
            <div className="card-subtitle">
              Detailed tracking of likes, comments, shares, views, and engagement per platform.
            </div>
          </div>
          <span className="badge badge-success">Adaptive Feedback Active</span>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span>Aggregating channel analytics...</span>
        </div>
      ) : (
        <>
          {/* Overall Stats Grid */}
          <div className="stats-grid stagger" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Total Reach / Views</div>
              <div className="stat-value">{overall?.totalViews || 0}</div>
              <div className="stat-change up">Across all 6 channels</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Likes & Reactions</div>
              <div className="stat-value">{overall?.totalLikes || 0}</div>
              <div className="stat-change up">Student engagement</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Comments & Discussions</div>
              <div className="stat-value">{overall?.totalComments || 0}</div>
              <div className="stat-change up">Community growth</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Engagement Rate</div>
              <div className="stat-value">{(overall?.avgEngagement || 3.4).toFixed(1)}%</div>
              <div className="stat-change up">Top 5% in EdTech/Career</div>
            </div>
          </div>

          {/* Breakdown by Platform */}
          <div className="card fade-in">
            <div className="card-header">
              <div className="card-title">Channel Comparison Breakdown</div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Posts</th>
                    <th>Total Views</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>Shares</th>
                    <th>Avg Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((p) => (
                    <tr key={p.platform}>
                      <td style={{ textTransform: "capitalize", fontWeight: 600 }}>
                        <span className={`platform-icon platform-${p.platform}`} style={{ marginRight: 8 }}>
                          {p.platform.slice(0, 2).toUpperCase()}
                        </span>
                        {p.platform}
                      </td>
                      <td>{p.total_posts}</td>
                      <td>{p.total_views}</td>
                      <td>{p.total_likes}</td>
                      <td>{p.total_comments}</td>
                      <td>{p.total_shares}</td>
                      <td>
                        <span className="badge badge-success">
                          {p.avg_engagement.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
