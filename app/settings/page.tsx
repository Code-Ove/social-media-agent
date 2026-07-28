"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface PlatformConn {
  platform: string;
  status: string;
}

export default function SettingsPage() {
  const [platforms, setPlatforms] = useState<PlatformConn[]>([]);
  const [simulationMode, setSimulationMode] = useState(true);

  useEffect(() => {
    async function loadPlatforms() {
      try {
        const res = await fetch("/api/platforms");
        if (res.ok) {
          const data = await res.json();
          setPlatforms(data.platforms || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadPlatforms();
  }, []);

  return (
    <DashboardLayout>
      <div className="card fade-in" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Agent Settings & API Configurations</div>
            <div className="card-subtitle">
              Manage LLM credentials, brand settings, and social platform connections.
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Brand & Agent Rules */}
        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title">Brand & Voice Configuration</div>
          </div>

          <div className="form-group">
            <label className="form-label">Brand Name</label>
            <input className="input" defaultValue="InternCareerPath" readOnly />
          </div>

          <div className="form-group">
            <label className="form-label">Target Audience & Niche</label>
            <input className="input" defaultValue="College students & fresh graduates seeking internships & careers" readOnly />
          </div>

          <div className="form-group">
            <label className="form-label">Primary Content Language</label>
            <input className="input" defaultValue="English" readOnly />
          </div>

          <div className="form-group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="form-label" style={{ marginBottom: 2 }}>Simulation Mode</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Generate content safely without real platform publishing</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={simulationMode} onChange={(e) => setSimulationMode(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Right Column: Platform Connection Status */}
        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title">Social Platform Connectors</div>
          </div>

          <div className="platform-grid" style={{ gridTemplateColumns: "1fr" }}>
            {platforms.map((p) => (
              <div key={p.platform} className="platform-card">
                <span className={`platform-icon platform-${p.platform}`}>
                  {p.platform.slice(0, 2).toUpperCase()}
                </span>
                <div className="platform-card-info">
                  <div className="platform-card-name">{p.platform}</div>
                  <div className="platform-card-status">
                    Mode: {simulationMode ? "Simulation" : p.status}
                  </div>
                </div>
                <span className="badge badge-info">
                  {simulationMode ? "SIM" : "CONNECTED"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
