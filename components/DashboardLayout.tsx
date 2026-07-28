"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AgentStatus {
  isRunning: boolean;
  latestRun?: {
    status: string;
    content_generated: number;
    started_at: string;
    finished_at?: string;
  };
}

interface Log {
  id: string;
  level: string;
  module?: string;
  message: string;
  created_at: string;
}

const NAV_ITEMS = [
  { href: "/", icon: "🏠", label: "Dashboard" },
  { href: "/review", icon: "👁️", label: "Review Queue" },
  { href: "/content", icon: "✍️", label: "Content" },
  { href: "/calendar", icon: "📅", label: "Calendar" },
  { href: "/analytics", icon: "📊", label: "Analytics" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: "in", instagram: "ig", twitter: "𝕏",
  facebook: "fb", tiktok: "tt", youtube: "yt",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<AgentStatus>({ isRunning: false });
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);

  const [pendingCount, setPendingCount] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const [agentRes, approveRes] = await Promise.all([
        fetch("/api/agent"),
        fetch("/api/approve"),
      ]);
      if (agentRes.ok) {
        const data = await agentRes.json();
        setStatus({ isRunning: data.isRunning, latestRun: data.latestRun });
        setLogs(data.recentLogs?.slice(0, 8) || []);
      }
      if (approveRes.ok) {
        const data = await approveRes.json();
        setPendingCount(data.counts?.pending || 0);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRunAgent = async () => {
    if (running) return;
    setRunning(true);
    try {
      await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredBy: "dashboard" }),
      });
      await fetchStatus();
    } finally {
      setRunning(false);
    }
  };

  const agentState = running || status.isRunning ? "running" : status.latestRun?.status === "failed" ? "error" : "idle";
  const agentStateLabel = running || status.isRunning ? "Running..." : status.latestRun?.status === "completed" ? "Ready" : "Idle";

  const currentPage = NAV_ITEMS.find(n => n.href === pathname)?.label || "Dashboard";

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🚀</div>
            <div className="sidebar-logo-text">
              <div className="sidebar-logo-title">InternCareerPath</div>
              <div className="sidebar-logo-sub">Social AI Agent</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.href === "/review" && pendingCount > 0 && (
                <span className="nav-badge">{pendingCount}</span>
              )}
            </Link>
          ))}

          <div className="nav-section-label" style={{ marginTop: 8 }}>Platforms</div>
          {Object.entries(PLATFORM_ICONS).map(([platform, icon]) => (
            <div key={platform} className="nav-item" style={{ cursor: "default" }}>
              <span className={`platform-icon platform-${platform}`}>{icon}</span>
              <span style={{ textTransform: "capitalize" }}>{platform}</span>
              <span className="nav-badge" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: 9 }}>SIM</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="agent-status-pill">
            <div className={`status-dot ${agentState}`} />
            <div>
              <div className="agent-status-text">AI Agent</div>
              <div className="agent-status-state">{agentStateLabel}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main">
        <header className="header">
          <div>
            <div className="header-title">{currentPage}</div>
            <div className="header-subtitle">InternCareerPath Social Media Agent</div>
          </div>
          <div className="header-actions">
            {logs.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {logs[0]?.message}
              </div>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRunAgent}
              disabled={running || status.isRunning}
              id="run-agent-btn"
            >
              {running || status.isRunning ? (
                <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Running...</>
              ) : (
                <><span>▶</span> Run Agent</>
              )}
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
