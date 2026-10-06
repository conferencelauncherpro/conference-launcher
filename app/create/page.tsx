"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CreateConference() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "Fall Parent-Teacher Conferences",
    location_type: "IN_PERSON",
    location_details: "Room 102",
    slot_duration_minutes: 12,
    buffer_minutes: 3,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const demoEmail = "teacher@school.org";

    // 1. Check if the demo user already exists
    let { data: user, error: userFetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", demoEmail)
      .maybeSingle();

    // 2. If the user doesn't exist yet, insert them
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({ email: demoEmail, full_name: "Demo Teacher" })
        .select()
        .single();

      if (createError) {
        alert(`Error creating demo user: ${createError.message}`);
        setLoading(false);
        return;
      }
      user = newUser;
    }

    // 3. Insert conference record into database using the user's ID
    const { data: conference, error: confError } = await supabase
      .from("conferences")
      .insert({
        user_id: user.id,
        title: formData.title,
        location_type: formData.location_type,
        location_details: formData.location_details,
        slot_duration_minutes: Number(formData.slot_duration_minutes),
        buffer_minutes: Number(formData.buffer_minutes),
      })
      .select()
      .single();

    setLoading(false);

    if (confError) {
      alert(`Error creating conference: ${confError.message}`);
    } else {
      // Redirect to the Slot Generator page for this new conference
      router.push(`/create/${conference.id}`);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-8">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-md p-8 border border-slate-200 mt-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Create Conference Night 🗓️
        </h1>
        <p className="text-slate-600 mb-6 text-sm">
          Set your schedule rules and meeting duration.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location Type
              </label>
              <select
                value={formData.location_type}
                onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="IN_PERSON">In-Person</option>
                <option value="GOOGLE_MEET">Google Meet</option>
                <option value="PHONE">Phone Call</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Room / Details
              </label>
              <input
                type="text"
                value={formData.location_details}
                onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meeting Duration (min)
              </label>
              <input
                type="number"
                value={formData.slot_duration_minutes}
                onChange={(e) => setFormData({ ...formData, slot_duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Buffer Time (min)
              </label>
              <input
                type="number"
                value={formData.buffer_minutes}
                onChange={(e) => setFormData({ ...formData, buffer_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save & Continue to Time Blocks →"}
          </button>
        </form>
      </div>
    </main>
  );
}