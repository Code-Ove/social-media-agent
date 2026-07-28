"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface Slide {
  headline: string;
  bullets: string[];
}

const PLATFORMS = ["linkedin", "instagram"];
const TOPICS = [
  "AI Skills for Entry-Level Jobs",
  "Resume for Fresh Graduates",
  "LinkedIn Profile Optimization",
  "Behavioral Interview Prep",
  "Salary Negotiation Tips",
  "Remote Internship Success",
  "Personal Branding for Students",
  "Tech Internship Applications",
];

export default function CarouselPage() {
  const [topic, setTopic] = useState("AI Skills for Entry-Level Jobs");
  const [platform, setPlatform] = useState("linkedin");
  const [slides, setSlides] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [customTopic, setCustomTopic] = useState("");

  const generate = async () => {
    const finalTopic = customTopic.trim() || topic;
    setLoading(true);
    setSlides([]);
    setActiveSlide(0);
    try {
      const res = await fetch("/api/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: finalTopic, platform }),
      });
      const data = await res.json();
      if (data.slides) setSlides(data.slides);
    } finally {
      setLoading(false);
    }
  };

  const parseSlide = (raw: string): Slide => {
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    const headline = lines[0]?.replace(/^\*\*|\*\*$/g, "") || "Slide";
    const bullets = lines.slice(1).map(l => l.replace(/^[•\-*]\s*/, ""));
    return { headline, bullets };
  };

  const copyAll = () => {
    const text = slides.map((s, i) => `--- Slide ${i + 1} ---\n${s}`).join("\n\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="card fade-in" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">🎠 Carousel Slide Builder</div>
            <div className="card-subtitle">
              Generate multi-slide carousel posts for LinkedIn & Instagram with AI
            </div>
          </div>
          {slides.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={copyAll}>
              📋 Copy All Slides
            </button>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Topic</label>
            <select
              className="form-select"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            >
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Platform</label>
            <select
              className="form-select"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Custom Topic (optional — overrides dropdown)</label>
          <input
            className="form-input"
            placeholder="e.g. How to get a Google internship in 2025..."
            value={customTopic}
            onChange={e => setCustomTopic(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: 8, width: "100%" }}
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <><span className="spinner" style={{ width: 14, height: 14, marginRight: 8 }} /> Generating carousel slides with AI...</>
          ) : (
            "✨ Generate Carousel"
          )}
        </button>
      </div>

      {/* Slide Preview */}
      {slides.length > 0 && (
        <div className="fade-in">
          {/* Slide Navigation Thumbnails */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                style={{
                  minWidth: 44,
                  height: 44,
                  borderRadius: 10,
                  border: `2px solid ${activeSlide === i ? "var(--primary)" : "var(--border)"}`,
                  background: activeSlide === i ? "var(--primary)" : "var(--bg-card)",
                  color: activeSlide === i ? "white" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Main Slide Preview */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Visual Preview */}
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Visual Preview — Slide {activeSlide + 1} of {slides.length}
              </div>
              <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
                borderRadius: 20,
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 28,
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(99,102,241,0.3)",
              }}>
                {/* Background decoration */}
                <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(99,102,241,0.15)" }} />
                <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(14,165,233,0.1)" }} />

                {/* Slide number */}
                <div style={{ position: "absolute", top: 16, left: 16, background: "var(--primary)", color: "white", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
                  {activeSlide + 1} / {slides.length}
                </div>

                {/* Brand */}
                <div style={{ position: "absolute", top: 16, right: 16, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                  InternCareerPath
                </div>

                {/* Content */}
                <div style={{ textAlign: "center", zIndex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1.3, marginBottom: 20, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                    {parseSlide(slides[activeSlide]).headline}
                  </div>
                  {parseSlide(slides[activeSlide]).bullets.slice(0, 3).map((bullet, bi) => (
                    <div key={bi} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, textAlign: "left" }}>
                      <span style={{ color: "#a5b4fc", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                  disabled={activeSlide === 0}
                >
                  ← Prev
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                  disabled={activeSlide === slides.length - 1}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Text Content Panel */}
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                All Slides Content
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 480, overflowY: "auto" }}>
                {slides.map((slide, i) => {
                  const parsed = parseSlide(slide);
                  return (
                    <div
                      key={i}
                      className="content-card"
                      style={{
                        cursor: "pointer",
                        borderLeft: `3px solid ${activeSlide === i ? "var(--primary)" : "var(--border)"}`,
                        padding: "12px 14px",
                        background: activeSlide === i ? "rgba(99,102,241,0.08)" : undefined,
                      }}
                      onClick={() => setActiveSlide(i)}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 6 }}>
                        <span style={{ color: "var(--primary)", marginRight: 8 }}>{i + 1}.</span>
                        {parsed.headline}
                      </div>
                      {parsed.bullets.map((b, bi) => (
                        <div key={bi} style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 16 }}>• {b}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
