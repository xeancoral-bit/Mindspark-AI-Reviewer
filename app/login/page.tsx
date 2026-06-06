"use client";

import React, { useState } from "react";
import { useAuth } from "../../components/auth-context";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setError(null);
    setSubmitting(true);
    
    const res = await login(email, password);
    setSubmitting(false);
    
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#040406] flex flex-col items-center justify-center bg-grid-pattern px-6 relative">
      {/* Decorative glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Back Button — top-left of screen */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm text-zinc-400 hover:text-white hover:border-indigo-500/50 backdrop-blur-sm transition-all group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </Link>

      <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Image src="/icon.svg" alt="MindSpark Logo" width={64} height={64} className="rounded-2xl shadow-xl shadow-indigo-500/10 mb-4 animate-float" unoptimized />
          <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Welcome to MindSpark
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to access your AI reviewers</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors text-white"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors text-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-white cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                Log In <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500 border-t border-zinc-900 pt-6">
          New to MindSpark?{" "}
          <Link href="/register" className="text-indigo-400 font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
