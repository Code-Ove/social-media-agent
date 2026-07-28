import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic") || "Career Growth Tips";
  const platform = searchParams.get("platform") || "linkedin";
  const subtitle = searchParams.get("subtitle") || "InternCareerPath Daily Advice";

  // Escape special XML characters for SVG
  const safeTopic = topic
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const safeSubtitle = subtitle
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Generate SVG Graphic
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>

      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0.05"/>
      </linearGradient>

      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#0ea5e9"/>
      </linearGradient>

      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="#000000" flood-opacity="0.5"/>
      </filter>

      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="40" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="1080" height="1080" fill="url(#bgGrad)"/>

    <!-- Decorative Glow Circles -->
    <circle cx="900" cy="150" r="300" fill="#6366f1" opacity="0.15" filter="url(#glow)"/>
    <circle cx="150" cy="900" r="250" fill="#0ea5e9" opacity="0.12" filter="url(#glow)"/>

    <!-- Outer Decorative Grid Lines -->
    <line x1="100" y1="0" x2="100" y2="1080" stroke="rgba(255,255,255,0.03)" stroke-width="2"/>
    <line x1="980" y1="0" x2="980" y2="1080" stroke="rgba(255,255,255,0.03)" stroke-width="2"/>

    <!-- Main Card Container -->
    <rect x="80" y="80" width="920" height="920" rx="40" fill="url(#cardGrad)" stroke="rgba(99, 102, 241, 0.3)" stroke-width="2" filter="url(#shadow)"/>

    <!-- Top Brand Header -->
    <g transform="translate(140, 140)">
      <!-- Logo Icon Box -->
      <rect width="64" height="64" rx="18" fill="url(#brandGrad)"/>
      <text x="32" y="42" font-family="Arial, sans-serif" font-weight="900" font-size="30" fill="#ffffff" text-anchor="middle">🚀</text>

      <!-- Brand Text -->
      <text x="84" y="34" font-family="'Inter', system-ui, sans-serif" font-weight="800" font-size="26" fill="#f8fafc" letter-spacing="-0.5">InternCareerPath</text>
      <text x="84" y="56" font-family="'Inter', system-ui, sans-serif" font-weight="600" font-size="14" fill="#818cf8" letter-spacing="2">CAREER &amp; INTERNSHIP AGENT</text>
    </g>

    <!-- Platform Badge -->
    <g transform="translate(760, 148)">
      <rect width="180" height="48" rx="24" fill="rgba(99, 102, 241, 0.2)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1.5"/>
      <text x="90" y="30" font-family="'Inter', system-ui, sans-serif" font-weight="700" font-size="14" fill="#a5b4fc" text-anchor="middle" letter-spacing="1" text-transform="uppercase">${platform}</text>
    </g>

    <!-- Center Content Block -->
    <g transform="translate(140, 360)">
      <!-- Topic Category Tag -->
      <rect x="0" y="0" width="220" height="38" rx="19" fill="rgba(14, 165, 233, 0.15)"/>
      <text x="110" y="24" font-family="'Inter', system-ui, sans-serif" font-weight="700" font-size="13" fill="#38bdf8" text-anchor="middle" letter-spacing="1">TRENDING ADVICE</text>

      <!-- Main Headline / Topic Title -->
      <foreignObject x="0" y="60" width="800" height="280">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Inter', system-ui, sans-serif; font-weight: 800; font-size: 52px; color: #ffffff; line-height: 1.25; letter-spacing: -1px; text-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          ${safeTopic}
        </div>
      </foreignObject>
    </g>

    <!-- Bullet Points / Visual Highlight Box -->
    <g transform="translate(140, 700)">
      <rect width="800" height="140" rx="24" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.5"/>
      <text x="40" y="55" font-family="'Inter', system-ui, sans-serif" font-weight="700" font-size="20" fill="#f8fafc">💡 Key Takeaway for Students</text>
      <text x="40" y="95" font-family="'Inter', system-ui, sans-serif" font-weight="400" font-size="18" fill="#94a3b8">${safeSubtitle}</text>
    </g>

    <!-- Bottom Footer Accent Line -->
    <rect x="140" y="940" width="800" height="4" rx="2" fill="url(#brandGrad)"/>
    <text x="540" y="975" font-family="'Inter', system-ui, sans-serif" font-weight="600" font-size="14" fill="#64748b" text-anchor="middle">Follow @InternCareerPath for daily student &amp; graduate tips</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
