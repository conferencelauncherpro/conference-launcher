import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { slotId, parentName, parentEmail, studentName } = await req.json();

    // 1. Fetch slot details + conference + teacher tokens
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select(`
        id,
        start_time,
        end_time,
        conference_id,
        conferences (
          title,
          location_type,
          location_details,
          user_id,
          users (
            google_access_token,
            google_refresh_token
          )
        )
      `)
      .eq("id", slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    const conf = slot.conferences as any;
    const teacher = conf?.users;

    // 2. Create Reservation Record in Supabase
    const { error: resError } = await supabase.from("reservations").insert({
      slot_id: slotId,
      parent_name: parentName,
      parent_email: parentEmail,
      student_name: studentName,
    });

    if (resError) {
      return NextResponse.json({ error: resError.message }, { status: 400 });
    }

    // 3. Update Slot availability
    await supabase.from("slots").update({ is_available: false }).eq("id", slotId);

    // 4. Create Google Calendar Event if teacher connected Google
    if (teacher?.google_refresh_token || teacher?.google_access_token) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: teacher.google_access_token,
        refresh_token: teacher.google_refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const isGoogleMeet = conf.location_type === "GOOGLE_MEET";

      const calendarEvent: any = {
        summary: `${conf.title} - ${studentName}`,
        description: `Parent-Teacher Conference for ${studentName}.\nParent: ${parentName} (${parentEmail})`,
        location: isGoogleMeet ? "Google Meet Video Call" : conf.location_details,
        start: { dateTime: slot.start_time },
        end: { dateTime: slot.end_time },
        attendees: [{ email: parentEmail, displayName: parentName }],
      };

      // Add auto-generated Google Meet video conferencing if selected
      if (isGoogleMeet) {
        calendarEvent.conferenceData = {
          createRequest: {
            requestId: `conf-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        };
      }

      await calendar.events.insert({
        calendarId: "primary",
        requestBody: calendarEvent,
        conferenceDataVersion: isGoogleMeet ? 1 : 0,
        sendUpdates: "all", // Automatically emails parent calendar invite
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}