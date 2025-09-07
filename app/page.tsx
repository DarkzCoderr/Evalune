"use client";

import Guest from "@/components/Guest";
import Resume from "@/components/Resume";
import Interview from "@/components/Interview";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function HomePage() {
  const { user } = useUser();
  const [resumeId, setResumeId] = useState<string | null>(null);

  // Enable smooth scroll globally
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  if (!user) return <Guest />;

  return (
    <main className="font-sans bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-900/20 text-gray-800 dark:text-gray-200 transition-colors duration-300 min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full max-w-6xl mx-auto px-6 py-20 sm:py-28 flex flex-col items-center text-center">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/40 via-green-200/20 to-teal-300/30 dark:from-emerald-900/40 dark:via-green-800/20 dark:to-teal-900/40 animate-gradient-xy"></div>
        </div>

        {/* Profile Avatar */}
        <div className="relative">
          <div className="absolute inset-0 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 blur-2xl opacity-60 animate-pulse"></div>
          <img
            src={user.imageUrl!}
            alt={`${user.firstName}'s profile`}
            className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl object-cover z-10"
          />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-lg z-20">
            <span className="text-white text-sm">✓</span>
          </div>
        </div>

        {/* Welcome */}
        <h1 className="mt-8 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-transparent bg-clip-text animate-gradient">
            Welcome Back, {user.firstName}! 🌟
          </span>
        </h1>

        <p className="mt-4 max-w-2xl text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
          Upload your resume, get smart interview questions, answer with audio, and
          receive instant AI feedback to sharpen your skills.
        </p>

        {/* CTA */}
        <a
          href="#resume-section"
          className="mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 hover:from-emerald-700 hover:via-green-600 hover:to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          Upload Resume
        </a>

        {/* Gradient Animation */}
        <style jsx>{`
          @keyframes gradient-xy {
            0%, 100% {
              background-position: 0% 0%;
            }
            50% {
              background-position: 100% 100%;
            }
          }
          .animate-gradient-xy {
            background-size: 200% 200%;
            animation: gradient-xy 12s ease infinite;
          }
        `}</style>
      </section>

      {/* Resume Upload */}
      <section
        id="resume-section"
        className="relative py-16 px-6 max-w-5xl mx-auto w-full"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
        <Resume onUploaded={(id) => setResumeId(id)} />
      </section>

      {/* Interview Section */}
      {resumeId && (
        <section
          id="interview-section"
          className="relative py-16 px-6 max-w-5xl mx-auto w-full"
        >
          <Interview resumeId={resumeId} />
        </section>
      )}
    </main>
  );
}
