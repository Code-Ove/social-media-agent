"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";

interface Log {
  id: string;
  level: "info" | "warn" | "error" | "success" | "debug";
  module?: string;
  message: string;
  created_at: string;
}

interface Content {
  id: string;
  type: string;
  platform: string;
  topic?: string;
  text_content?: string;
  image_url?: string;
  status: string;
  scheduled_at?: string;
  created_at: string;
}

interface AnalyticsSummary {
  platform: string;
  avg_engagement: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_views: number;
  total_posts: number;
}

export default function HomePage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [agentRes, contentRes, analyticsRes] = await Promise.all([
        fetch("/api/agent"),
        fetch("/api/content?limit=6"),
        fetch("/api/analytics"),
      ]);

      if (agentRes.ok) {
        const data = await agentRes.json();
        setLogs(data.recentLogs || []);
      }
      if (contentRes.ok) {
        const data = await contentRes.json();
        setRecentContent(data.content || []);
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data.summary || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRunAgent = async () => {
    setRunning(true);
    try {
      await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredBy: "dashboard_button" }),
      });
      await loadData();
    } finally {
      setRunning(false);
    }
  };

  const totalPosts = recentContent.length;
  const simulatedCount = recentContent.filter((c) => c.status === "simulated" || c.status === "posted").length;

  return (
    <DashboardLayout>
      {/* ── Hero Agent Control Box ── */}
      <div className="agent-control fade-in">
        <div className="agent-avatar">🧠</div>
        <div className="agent-info">
          <div className="agent-title">InternCareerPath Autonomous Growth Brain</div>
          <div className="agent-desc">
            Your AI Agent is configured to auto-find career trends, draft platform-tailored posts, generate visuals, and optimize brand tone for college students & fresh grads.
          </div>
          <div className="agent-buttons">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleRunAgent}
              disabled={running}
              id="hero-run-agent"
            >
              {running ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Agent Thinking & Generating...
                </>
              ) : (
                <>
                  <span>✨</span> Trigger Growth Cycle Now
                </>
              )}
            </button>
            <Link href="/content" className="btn btn-secondary btn-lg">
              Manage Content ({recentContent.length})
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid stagger">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)" }}>
            📈
          </div>
          <div className="stat-value">{totalPosts}</div>
          <div className="stat-label">Generated Pieces</div>
          <div className="stat-change up">↑ Active Pipeline</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(14, 165, 233, 0.15)" }}>
            ⚡
          </div>
          <div className="stat-value">6</div>
          <div className="stat-label">Active Platforms</div>
          <div className="stat-change up">Simulation Enabled</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)" }}>
            🎯
          </div>
          <div className="stat-value">{simulatedCount}</div>
          <div className="stat-label">Simulated/Posted</div>
          <div className="stat-change up">Ready for publishing</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)" }}>
            🤖
          </div>
          <div className="stat-value">Adaptive</div>
          <div className="stat-label">Brand Voice</div>
          <div className="stat-change up">Multi-LLM Engine</div>
        </div>
      </div>

      {/* ── 2 Column Grid for Recent Content & Logs ── */}
      <div className="grid-2" style={{ marginTop: 24 }}>
        {/* Left Column: Recent Content */}
        <div className="card fade-in fade-in-delay-1">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Generated Posts</div>
              <div className="card-subtitle">Freshly generated AI content for social channels</div>
            </div>
            <Link href="/content" className="btn btn-secondary btn-sm">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Fetching latest content...</span>
            </div>
          ) : recentContent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">No content generated yet</div>
              <div className="empty-state-desc">
                Click &quot;Trigger Growth Cycle Now&quot; above to run the AI agent and generate content!
              </div>
            </div>
          ) : (
            <div className="content-grid" style={{ gridTemplateColumns: "1fr" }}>
              {recentContent.slice(0, 3).map((item) => (
                <div key={item.id} className="content-card">
                  <div className="content-card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`platform-icon platform-${item.platform}`}>
                        {item.platform.slice(0, 2).toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>
                        {item.platform} • {item.type}
                      </span>
                    </div>
                    <span
                      className={`badge ${
                        item.status === "posted"
                          ? "badge-success"
                          : item.status === "simulated"
                          ? "badge-info"
                          : "badge-warning"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="content-card-body">{item.text_content}</div>
                  <div className="content-card-footer">
                    <span className="content-card-date">
                      Topic: <strong>{item.topic || "Career Growth"}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Agent Execution Logs */}
        <div className="card fade-in fade-in-delay-2">
          <div className="card-header">
            <div>
              <div className="card-title">Live Agent Activity Log</div>
              <div className="card-subtitle">Real-time brain operations and decisions</div>
            </div>
            <span className="badge badge-purple">Live Feed</span>
          </div>

          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📡</div>
              <div className="empty-state-title">No activity logs recorded</div>
              <div className="empty-state-desc">Run the agent to view execution steps.</div>
            </div>
          ) : (
            <div className="log-feed">
              {logs.map((log) => (
                <div key={log.id} className="log-item">
                  <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}</span>
                  <span className="log-module">[{log.module || "brain"}]</span>
                  <span className="log-message">{log.message}</span>
                  <span className="log-time">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
