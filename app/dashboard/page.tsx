"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface ConferenceWithSlots {
  id: string;
  title: string;
  location_type: string;
  location_details: string;
  created_at: string;
  slots: {
    id: string;
    is_available: boolean;
    reservations: {
      parent_name: string;
      student_name: string;
      parent_email: string;
    }[];
  }[];
}

export default function TeacherDashboard() {
  const [conferences, setConferences] = useState<ConferenceWithSlots[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      // Fetch all conferences with their nested slots and reservations
      const { data, error } = await supabase
        .from("conferences")
        .select(`
          id,
          title,
          location_type,
          location_details,
          created_at,
          slots (
            id,
            is_available,
            reservations (
              parent_name,
              student_name,
              parent_email
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setConferences(data as unknown as ConferenceWithSlots[]);
      }
      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  function handleConnectGoogle() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    
    // Request both Calendar and User Info scopes
    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];
    const scope = encodeURIComponent(scopes.join(" "));

    if (!clientId) {
      alert("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local file.");
      return;
    }

    // Construct OAuth consent URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&access_type=offline&prompt=consent`;

    window.location.href = authUrl;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-8">
      <div className="max-w-3xl w-full mt-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Teacher Dashboard 📋
            </h1>
            <p className="text-slate-500 text-sm">
              Manage your conference events and parent sign-ups.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleConnectGoogle}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center shadow-xs"
            >
              📅 Connect Google Calendar
            </button>
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-xs"
            >
              + Create New Event
            </Link>
          </div>
        </div>

        {/* Empty State vs Conference List */}
        {conferences.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200 text-center">
            <p className="text-slate-500 mb-4">
              No conference events created yet.
            </p>
            <Link
              href="/create"
              className="text-blue-600 hover:underline font-medium text-sm"
            >
              Set up your first event →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {conferences.map((conf) => {
              const totalSlots = conf.slots?.length || 0;
              const bookedSlots =
                conf.slots?.filter((s) => !s.is_available).length || 0;

              return (
                <div
                  key={conf.id}
                  className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {conf.title}
                      </h2>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {conf.location_details} ({conf.location_type})
                      </p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {bookedSlots} / {totalSlots} Booked
                    </span>
                  </div>

                  {/* Shareable Link Box */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 truncate mr-2">
                      Booking Link:{" "}
                      <code className="text-slate-800 font-mono">{`/book/${conf.id}`}</code>
                    </span>
                    <button
                      onClick={() => {
                        const fullUrl = `${window.location.origin}/book/${conf.id}`;
                        navigator.clipboard.writeText(fullUrl);
                        alert("Copied shareable booking link to clipboard!");
                      }}
                      className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium py-1 px-3 rounded shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}