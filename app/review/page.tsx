"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface ContentItem {
  id: string;
  type: string;
  platform: string;
  topic?: string;
  text_content?: string;
  image_url?: string;
  hashtags?: string;
  status: string;
  ai_provider?: string;
  scheduled_at?: string;
  created_at: string;
}

export default function ReviewPage() {
  const [pending, setPending] = useState<ContentItem[]>([]);
  const [approved, setApproved] = useState<ContentItem[]>([]);
  const [rejected, setRejected] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/approve");
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending || []);
        setApproved(data.approved || []);
        setRejected(data.rejected || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      await loadData();
      if (previewItem?.id === id) setPreviewItem(null);
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveAll = async () => {
    for (const item of pending) {
      await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action: "approve" }),
      });
    }
    await loadData();
  };

  const ContentCard = ({ item, showActions = true }: { item: ContentItem; showActions?: boolean }) => (
    <div className="content-card" style={{ borderLeft: `3px solid ${
      item.status === "approved" ? "var(--success)" :
      item.status === "rejected" ? "var(--danger)" : "var(--primary)"
    }` }}>
      <div className="content-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={`platform-icon platform-${item.platform}`}>
            {item.platform.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, textTransform: "capitalize" }}>
              {item.platform} • {item.type}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              AI: {item.ai_provider || "simulation"}
            </div>
          </div>
        </div>
        <span className={`badge ${
          item.status === "approved" ? "badge-success" :
          item.status === "rejected" ? "badge-danger" : "badge-warning"
        }`}>
          {item.status.replace("_", " ")}
        </span>
      </div>

      {item.image_url && item.image_url.startsWith("http") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt="AI generated" className="content-card-image" />
      )}

      {item.image_url && item.image_url.startsWith("/api/image") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt="Topic banner" className="content-card-image" style={{ background: "#0f172a" }} />
      )}

      <div className="content-card-body">{item.text_content}</div>

      <div className="content-card-footer">
        <span className="content-card-date">
          📌 {item.topic || "Career"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPreviewItem(item)}>
            Preview
          </button>
          {showActions && item.status === "pending_review" && (
            <>
              <button
                className="btn btn-sm"
                style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", border: "1px solid rgba(16, 185, 129, 0.3)" }}
                onClick={() => handleAction(item.id, "approve")}
                disabled={processing === item.id}
              >
                {processing === item.id ? "..." : "✓ Approve"}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleAction(item.id, "reject")}
                disabled={processing === item.id}
              >
                {processing === item.id ? "..." : "✕ Reject"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="card fade-in" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Content Review & Approval</div>
            <div className="card-subtitle">
              Inspect AI-generated posts before they go live. Approve to queue for publishing or reject to discard.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="badge badge-warning">⏳ {pending.length} Pending</span>
            <span className="badge badge-success">✓ {approved.length} Approved</span>
            <span className="badge badge-danger">✕ {rejected.length} Rejected</span>
            {pending.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={handleApproveAll}>
                ✓ Approve All ({pending.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>Loading content review queue...</span></div>
      ) : (
        <>
          {/* Pending Review Section */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                ⏳ Awaiting Your Review
              </h2>
              <span className="badge badge-warning">{pending.length} posts</span>
            </div>

            {pending.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-title">No content pending review</div>
                <div className="empty-state-desc">Run the AI agent to generate new posts for review!</div>
              </div>
            ) : (
              <div className="content-grid stagger">
                {pending.map(item => <ContentCard key={item.id} item={item} showActions={true} />)}
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Approved Section */}
          {approved.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--success)" }}>
                  ✅ Approved & Queued
                </h2>
                <span className="badge badge-success">{approved.length} posts</span>
              </div>
              <div className="content-grid stagger">
                {approved.slice(0, 6).map(item => <ContentCard key={item.id} item={item} showActions={false} />)}
              </div>
            </div>
          )}

          {/* Rejected Section */}
          {rejected.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--danger)" }}>
                  ❌ Rejected
                </h2>
                <span className="badge badge-danger">{rejected.length} posts</span>
              </div>
              <div className="content-grid stagger">
                {rejected.slice(0, 3).map(item => <ContentCard key={item.id} item={item} showActions={false} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}
          onClick={() => setPreviewItem(null)}
        >
          <div className="card fade-in" style={{ maxWidth: 620, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ textTransform: "capitalize" }}>
                  {previewItem.platform} • {previewItem.type} Post Preview
                </div>
                <div className="card-subtitle">Topic: {previewItem.topic}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewItem(null)}>✕ Close</button>
            </div>

            {previewItem.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewItem.image_url} alt="Post visual" style={{ width: "100%", borderRadius: 12, marginBottom: 16 }} />
            )}

            <div style={{ whiteSpace: "pre-wrap", background: "var(--bg-input)", padding: 16, borderRadius: 12, fontSize: 14, color: "var(--text-primary)", marginBottom: 16, lineHeight: 1.7 }}>
              {previewItem.text_content}
            </div>

            {previewItem.status === "pending_review" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-sm"
                  style={{ flex: 1, background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", border: "1px solid rgba(16, 185, 129, 0.3)" }}
                  onClick={() => handleAction(previewItem.id, "approve")}
                >
                  ✓ Approve & Queue for Publishing
                </button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleAction(previewItem.id, "reject")}>
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
