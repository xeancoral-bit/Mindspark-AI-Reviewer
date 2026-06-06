"use client";

import Link from "next/link";
import { useAuth } from "../components/auth-context";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Trophy,
  Zap,
  UploadCloud,
  Layers,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      title: "Universal Upload",
      description: "Support for PDF, DOCX, PPTX, and TXT files. MindSpark handles everything from lecture slides to textbook chapters.",
      icon: UploadCloud,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "AI Core Summaries",
      description: "Get structured outline bullet notes and categorized terms automatically chunked to handle large textbooks without missing a beat.",
      icon: Layers,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      title: "7 Study Modes",
      description: "Test yourself using Multiple Choice, True/False, Fill in the Blanks, Matching, Flashcards, Identification, and Timed Quizzes.",
      icon: Brain,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      title: "Gamified Progress",
      description: "Earn XP, unlock achievement badges, level up your avatar, and race to the top of the global leaderboard.",
      icon: Trophy,
      color: "text-amber-500 bg-amber-500/10",
    },
  ];

  const games = [
    { name: "Multiple Choice", desc: "4-option structured exam prep questions." },
    { name: "True or False", desc: "Evaluate facts and definitions rapidly." },
    { name: "Fill in the Blanks", desc: "Type context keywords directly inline." },
    { name: "Matching Type", desc: "Connect terms and explanations visually." },
    { name: "3D Flashcards", desc: "Traditional flip cards for memory recall." },
    { name: "Identification", desc: "Recall terms from prompt details directly." },
    { name: "Timed Quiz", desc: "Beat the countdown to score maximum XP." },
  ];

  return (
    <div className="min-h-screen bg-[#040406] text-white flex flex-col bg-grid-pattern relative overflow-hidden">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="MindSpark Logo" className="h-9 w-9 rounded-xl shadow-md shadow-indigo-500/10" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            MindSpark
          </span>
        </div>

        <nav className="flex items-center gap-6">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                Log In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                Sign Up Free <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-6 pt-20 pb-16 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 animate-pulse-glow">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Academic Review Platform
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8">
          Study Smarter, Not Harder.<br />
          Sparked by{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Generative AI.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-12">
          Upload PDF, DOCX, PPTX, or TXT study resources. Get comprehensive summaries, detailed reviewer outline notes, and 7 interactive study games designed to lock in concepts.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
          {user ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full font-semibold text-base hover:shadow-xl hover:shadow-indigo-500/30 transition-all hover:scale-[1.02]"
            >
              Start Studying Now <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full font-semibold text-base hover:shadow-xl hover:shadow-indigo-500/30 transition-all hover:scale-[1.02]"
              >
                Create Free Account <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full font-semibold text-base transition-all hover:scale-[1.02]"
              >
                Log In to Workspace
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto w-full px-6 py-20 z-10 border-t border-zinc-800/50">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">Complete Study Pipeline</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">MindSpark compiles your learning materials into interactive study nodes instantly.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800/80 transition-all group hover:translate-y-[-2px]">
                <div className={`p-3 rounded-xl w-fit ${feat.color} mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-3">{feat.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Modes Info */}
      <section className="max-w-7xl mx-auto w-full px-6 py-20 z-10 border-t border-zinc-800/50">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-left">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit mb-5">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-6">Interactive Study Assessment Engines</h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Unlike static review summaries, MindSpark generates specific active-recall quizzes. Studies show active recall accelerates memory retention by up to 150%.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Toggle between modes dynamically depending on your exam structure. Take timed quizzes to practice speed under simulated exam pressure.
            </p>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {games.map((g, i) => (
              <div key={g.name} className="p-5 rounded-xl bg-zinc-950 border border-zinc-900 flex gap-4 items-start">
                <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-sm shrink-0">
                  {i + 1}
                </span>
                <div>
                  <h4 className="font-bold text-base mb-1">{g.name}</h4>
                  <p className="text-zinc-500 text-xs">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-black/40 py-8 text-center text-xs text-zinc-600 z-10">
        &copy; {new Date().getFullYear()} MindSpark AI Reviewer. All rights reserved.
      </footer>
    </div>
  );
}
