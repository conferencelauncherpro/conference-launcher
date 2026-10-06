import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${req.nextUrl.origin}/api/auth/callback/google`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info directly using the authenticated oauth2Client
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const userEmail = userInfo.data.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Could not retrieve user email from Google" },
        { status: 400 }
      );
    }

    // Check if user exists in Supabase
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (existingUser) {
      // Update existing user record with Google tokens
      await supabase
        .from("users")
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token || undefined,
        })
        .eq("email", userEmail);
    } else {
      // Insert new user if not found
      await supabase.from("users").insert({
        email: userEmail,
        full_name: userInfo.data.name || "Teacher",
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      });
    }

    return NextResponse.redirect(`${req.nextUrl.origin}/dashboard?google=connected`);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}