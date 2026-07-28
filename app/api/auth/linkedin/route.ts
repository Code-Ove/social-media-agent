import { NextRequest, NextResponse } from "next/server";
import { platformDb } from "@/lib/db";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const clientId = process.env.LINKEDIN_CLIENT_ID || "86w8l8dbgad32c";
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || "";
  const redirectUri = `${origin}/api/auth/linkedin`;

  if (error) {
    return NextResponse.json({ error: `LinkedIn OAuth error: ${error}` }, { status: 400 });
  }

  // If no code, redirect to LinkedIn Authorization URL
  if (!code) {
    const scope = encodeURIComponent("openid profile w_member_social email");
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    return NextResponse.redirect(authUrl);
  }

  // Exchange auth code for access token
  try {
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;
    const expiresIn = tokenRes.data.expires_in;

    // Fetch user profile info to get Person ID
    let personId = "";
    try {
      const userRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      personId = userRes.data.sub || "";
    } catch {
      // Fallback
    }

    // Save connection to database
    await platformDb.update("linkedin", {
      status: "connected",
      access_token: accessToken,
      page_id: personId,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "🎉 LinkedIn successfully connected!",
      LINKEDIN_ACCESS_TOKEN: accessToken,
      LINKEDIN_PERSON_ID: personId,
      nextStep: "Copy LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_ID to your .env.local and Vercel Environment Variables!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to exchange token: ${message}` }, { status: 500 });
  }
}
