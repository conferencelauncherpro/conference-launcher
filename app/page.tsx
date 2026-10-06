"use client";

import { supabase } from "@/lib/supabase";

export default function Home() {
  async function testDatabaseConnection() {
    // Try fetching the users list from Supabase
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      alert(`Database connection failed: ${error.message}`);
    } else {
      alert(`🎉 Connected to Supabase successfully! Found ${data.length} users.`);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-8">
      {/* App Header */}
      <header className="max-w-2xl w-full text-center mt-12 mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          Conference Launcher 🚀
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          The easiest way to schedule parent-teacher conferences using Google Calendar.
        </p>
      </header>

      {/* Main Action Box */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 border border-slate-200 text-center">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Test Database Connection
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Click below to test if your Next.js app can communicate with Supabase.
        </p>
        <button 
          onClick={testDatabaseConnection}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Test Supabase Connection
        </button>
      </div>
    </main>
  );
}