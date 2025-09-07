// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getDashboardData } from "@/app/actions/getDashboardData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DashboardInterview = {
  id: string;
  startedAt: string; // ISO
  score: number | null;
  feedback: {
    summary?: string | null;
    overall_score?: number | null;
    strengths?: string[] | null;
    improvements?: string[] | null;
  } | null;
};

type DashboardData = {
  interviews: DashboardInterview[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getDashboardData();
        setData(res);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setData({ interviews: [] });
      }
    })();
  }, []);

  if (!data) {
    return <p className="text-center mt-10">Loading dashboard...</p>;
  }

  // Build trend data for chart. Ensure score is numeric or null.
  const trendData = data.interviews.map((it) => {
    const raw = it.feedback?.overall_score ?? it.score;
const num = Number(raw); // Always number, may be NaN

return {
  date: new Date(it.startedAt).toLocaleDateString(),
  score: Number.isFinite(num) ? Math.round(num * 10) / 10 : null,
};

  });

  // Metrics
  const interviewCount = data.interviews.length;
  const avgScore =
    interviewCount > 0
      ? (
          data.interviews.reduce((acc, it) => {
            const sc = it.feedback?.overall_score ?? it.score ?? null;
            const n = sc === null || sc === undefined ? 0 : Number(sc);
            return acc + (Number.isFinite(n) ? n : 0);
          }, 0) / interviewCount
        ).toFixed(1)
      : "0.0";

  const lastInterview = data.interviews[data.interviews.length - 1];
  const lastScore = lastInterview
    ? lastInterview.feedback?.overall_score ?? lastInterview.score ?? null
    : null;

  return (
    <div className="font-sans bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 text-gray-800 dark:text-gray-200 transition-all duration-300 min-h-screen">
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Your <span className="text-emerald-600 dark:text-emerald-400">Dashboard</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Review past interviews, track trends, and see AI feedback at a glance.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl border shadow">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-emerald-600">{avgScore} / 10</p>
            </div>

            <div className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl border shadow">
              <p className="text-sm text-gray-500">Total Interviews</p>
              <p className="text-2xl font-bold text-green-600">{interviewCount}</p>
            </div>

            <div className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl border shadow">
              <p className="text-sm text-gray-500">Last Score</p>
              <p className="text-2xl font-bold text-teal-600">
                {lastScore === null || lastScore === undefined ? "—" : `${lastScore}/10`}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 border shadow mb-8">
            <h2 className="text-lg font-semibold mb-4">Performance Over Time</h2>

            {trendData.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip
                    formatter={(val: any) => (val === null || val === undefined ? "—" : val)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No interviews yet.</p>
            )}
          </div>

          {/* Past Interviews */}
          <div className="grid gap-6">
            {data.interviews.map((it) => (
              <div
                key={it.id}
                className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl border shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(it.startedAt).toLocaleString()}
                    </p>
                    <p className="font-medium mt-1">
                      Score: {it.feedback?.overall_score ?? it.score ?? "—"} / 10
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-gray-700 dark:text-gray-300">
                  {it.feedback?.summary ?? "No summary feedback for this attempt."}
                </p>

                {it.feedback?.strengths?.length ? (
                  <div className="mt-4">
                    <h3 className="font-semibold text-sm text-emerald-600">Strengths</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {it.feedback!.strengths!.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {it.feedback?.improvements?.length ? (
                  <div className="mt-4">
                    <h3 className="font-semibold text-sm text-red-600">Areas to Improve</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {it.feedback!.improvements!.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
