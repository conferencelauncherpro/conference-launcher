"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

interface Conference {
  id: string;
  title: string;
  slot_duration_minutes: number;
  buffer_minutes: number;
}

export default function SlotGeneratorPage() {
  const params = useParams();
  const conferenceId = params.id as string;

  const [conference, setConference] = useState<Conference | null>(null);
  const [date, setDate] = useState("2026-10-15");
  const [startTime, setStartTime] = useState("16:00"); // 4:00 PM
  const [endTime, setEndTime] = useState("20:00");   // 8:00 PM
  const [generatedSlots, setGeneratedSlots] = useState<{ start: string; end: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch conference settings from Supabase
  useEffect(() => {
    async function loadConference() {
      const { data, error } = await supabase
        .from("conferences")
        .select("*")
        .eq("id", conferenceId)
        .single();

      if (data) setConference(data);
    }
    if (conferenceId) loadConference();
  }, [conferenceId]);

  // Generate slots in memory based on duration + buffer
  function generateSlots() {
    if (!conference) return;

    const slots = [];
    let current = new Date(`${date}T${startTime}:00`);
    const windowEnd = new Date(`${date}T${endTime}:00`);

    const durationMs = conference.slot_duration_minutes * 60 * 1000;
    const bufferMs = conference.buffer_minutes * 60 * 1000;

    while (current.getTime() + durationMs <= windowEnd.getTime()) {
      const slotEnd = new Date(current.getTime() + durationMs);

      slots.push({
        start: current.toTimeString().slice(0, 5),
        end: slotEnd.toTimeString().slice(0, 5),
        fullStart: new Date(current),
        fullEnd: new Date(slotEnd),
      });

      // Advance clock by duration + buffer
      current = new Date(slotEnd.getTime() + bufferMs);
    }

    setGeneratedSlots(slots);
  }

  // Save generated slots to Supabase
  async function saveSlotsToDatabase() {
    if (generatedSlots.length === 0) return;
    setSaving(true);

    // Add RLS policy fallback check for slots table
    const slotsToInsert = generatedSlots.map((slot) => ({
      conference_id: conferenceId,
      start_time: slot.fullStart.toISOString(),
      end_time: slot.fullEnd.toISOString(),
      is_available: true,
    }));

    const { error } = await supabase.from("slots").insert(slotsToInsert);

    setSaving(false);

    if (error) {
      alert(`Error saving slots: ${error.message}`);
    } else {
      alert(`🎉 Successfully created ${generatedSlots.length} bookable time slots!`);
    }
  }

  if (!conference) {
    return <div className="p-8 text-center text-slate-600">Loading conference details...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md p-8 border border-slate-200 mt-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {conference.title}
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Setting slots with <strong className="text-slate-800">{conference.slot_duration_minutes} min</strong> meetings and <strong className="text-slate-800">{conference.buffer_minutes} min</strong> buffers.
        </p>

        {/* Time Window Input */}
        <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-slate-900 text-sm"
            />
          </div>
        </div>

        <button
          onClick={generateSlots}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg mb-6 text-sm transition-colors"
        >
          Preview Generated Time Slots
        </button>

        {/* Generated Slots Preview */}
        {generatedSlots.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
              Generated Slots ({generatedSlots.length} Total)
            </h2>
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg mb-6 bg-slate-50">
              {generatedSlots.map((slot, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 p-2 rounded text-center text-xs font-mono text-slate-700 shadow-sm"
                >
                  {slot.start} - {slot.end}
                </div>
              ))}
            </div>

            <button
              onClick={saveSlotsToDatabase}
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving Slots..." : `Save All ${generatedSlots.length} Slots to Database →`}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}