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
  image_prompt?: string;
  hashtags?: string;
  status: string;
  scheduled_at?: string;
  ai_provider?: string;
  created_at: string;
}

const PLATFORMS = ["all", "linkedin", "instagram", "twitter", "facebook", "tiktok", "youtube"];

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeModalItem, setActiveModalItem] = useState<ContentItem | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedPlatform === "all" ? "/api/content" : `/api/content?platform=${selectedPlatform}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.content || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content piece?")) return;
    try {
      await fetch(`/api/content?id=${id}`, { method: "DELETE" });
      fetchContent();
      if (activeModalItem?.id === id) setActiveModalItem(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="card fade-in" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Content Pipeline & Repository</div>
            <div className="card-subtitle">
              All AI-generated social media posts, carousels, and video scripts for InternCareerPath.
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`btn btn-sm ${selectedPlatform === p ? "btn-primary" : "btn-secondary"}`}
              style={{ textTransform: "capitalize" }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span>Loading content repository...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-title">No content found</div>
          <div className="empty-state-desc">
            No posts generated for platform &quot;{selectedPlatform}&quot; yet. Run the agent from the dashboard!
          </div>
        </div>
      ) : (
        <div className="content-grid stagger">
          {items.map((item) => (
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

              {item.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.topic || "AI Generated"}
                  className="content-card-image"
                />
              )}

              <div className="content-card-body">{item.text_content}</div>

              <div className="content-card-footer">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                    {item.topic || "General Career"}
                  </div>
                  <div className="content-card-date">
                    Provider: {item.ai_provider || "Simulation"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveModalItem(item)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {activeModalItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 20,
          }}
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="card fade-in"
            style={{ maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <div className="card-title" style={{ textTransform: "capitalize" }}>
                  {activeModalItem.platform} {activeModalItem.type} Post Preview
                </div>
                <div className="card-subtitle">Topic: {activeModalItem.topic}</div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveModalItem(null)}
              >
                ✕ Close
              </button>
            </div>

            {activeModalItem.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeModalItem.image_url}
                alt="Post Preview"
                style={{ width: "100%", borderRadius: 12, marginBottom: 16 }}
              />
            )}

            <div
              style={{
                whiteSpace: "pre-wrap",
                background: "var(--bg-input)",
                padding: 16,
                borderRadius: 12,
                fontSize: 13,
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              {activeModalItem.text_content}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-purple">
                AI Engine: {activeModalItem.ai_provider || "simulation"}
              </span>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(activeModalItem.id)}
              >
                Delete Content
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
