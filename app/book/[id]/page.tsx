"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Conference {
  id: string;
  title: string;
  location_type: string;
  location_details: string;
}

export default function PublicBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const conferenceId = resolvedParams.id;

  const [conference, setConference] = useState<Conference | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  useEffect(() => {
    async function loadConferenceData() {
      // 1. Fetch Conference Info
      const { data: confData, error: confError } = await supabase
        .from("conferences")
        .select("id, title, location_type, location_details")
        .eq("id", conferenceId)
        .single();

      if (confError || !confData) {
        setLoading(false);
        return;
      }

      setConference(confData);

      // 2. Fetch Available Slots
      const { data: slotData } = await supabase
        .from("slots")
        .select("id, start_time, end_time, is_available")
        .eq("conference_id", conferenceId)
        .order("start_time", { ascending: true });

      if (slotData) {
        setSlots(slotData);
      }
      setLoading(false);
    }

    loadConferenceData();
  }, [conferenceId]);

  async function handleReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmitting(true);

    const res = await fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId: selectedSlot.id,
        parentName,
        parentEmail,
        studentName,
      }),
    });

    const result = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      alert(`Error reserving slot: ${result.error}`);
    } else {
      setBookedSuccess(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        Loading schedule...
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        Conference event not found.
      </div>
    );
  }

  if (bookedSuccess) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Reservation Confirmed!
          </h1>
          <p className="text-slate-600 text-sm mb-6">
            We’ve locked in your time slot for{" "}
            <strong className="text-slate-800">{studentName}</strong>. A calendar invite and summary have been sent to{" "}
            <span className="font-medium text-slate-800">{parentEmail}</span>.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 text-slate-600 mb-6">
            <p>
              <strong className="text-slate-800">Event:</strong> {conference.title}
            </p>
            <p>
              <strong className="text-slate-800">Time:</strong>{" "}
              {selectedSlot &&
                new Date(selectedSlot.start_time).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
            </p>
            <p>
              <strong className="text-slate-800">Location:</strong>{" "}
              {conference.location_details} ({conference.location_type})
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full border border-slate-100 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{conference.title}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {conference.location_details} • Select an available time slot below.
          </p>
        </div>

        {/* Time Slot Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Available Slots
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const formattedTime = new Date(slot.start_time).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit" }
              );

              if (!slot.is_available) {
                return (
                  <button
                    key={slot.id}
                    disabled
                    className="p-3 text-xs font-medium rounded-lg border border-slate-200 bg-slate-100 text-slate-400 line-through text-left cursor-not-allowed"
                  >
                    {formattedTime} (Booked)
                  </button>
                );
              }

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 text-xs font-medium rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  {formattedTime}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reservation Form */}
        {selectedSlot && (
          <form onSubmit={handleReservation} className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Parent/Guardian Full Name
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full text-slate-900 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Parent Email Address
              </label>
              <input
                type="email"
                required
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full text-slate-900 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Student Full Name
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Alex Doe"
                className="w-full text-slate-900 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors text-sm shadow-md"
            >
              {submitting ? "Booking..." : "Confirm & Reserve Slot →"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}