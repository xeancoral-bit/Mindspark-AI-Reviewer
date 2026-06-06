"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard-layout";
import { useAuth } from "../../components/auth-context";
import { User, Key, Save, Trash2, CheckCircle, Loader2 } from "lucide-react";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchSettingsStatus = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        await res.json();
        // Request the current key state (masked) from the profile settings API
        const settingsRes = await fetch("/api/user/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // Empty post to get info or trigger check
        }).catch(() => null);

        if (settingsRes && settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.user?.hasApiKey) {
            setHasApiKey(true);
            setApiKey("••••••••••••••••••••");
          } else {
            setHasApiKey(false);
            setApiKey("");
          }
        }
      }
    } catch {
      console.error("Failed to fetch settings status");
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      fetchSettingsStatus();
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, apiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveStatus({ type: "error", message: data.error || "Failed to save settings." });
      } else {
        setSaveStatus({ type: "success", message: "Settings saved successfully!" });
        if (data.user?.hasApiKey) {
          setHasApiKey(true);
          setApiKey("••••••••••••••••••••");
        } else {
          setHasApiKey(false);
          setApiKey("");
        }
        await refreshUser();
      }
    } catch {
      setSaveStatus({ type: "error", message: "Failed to connect to the server." });
    } finally {
      setLoading(false);
    }
  };

  const handleClearApiKey = async () => {
    setLoading(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "" }), // Clear key
      });

      if (res.ok) {
        setSaveStatus({ type: "success", message: "OpenAI API key removed." });
        setApiKey("");
        setHasApiKey(false);
        await refreshUser();
      } else {
        const data = await res.json();
        setSaveStatus({ type: "error", message: data.error || "Failed to remove API key." });
      }
    } catch {
      setSaveStatus({ type: "error", message: "Failed to connect to server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8 select-none">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Profile Settings</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Customize your learning account credentials and secure API configurations.
          </p>
        </div>

        {saveStatus && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
              saveStatus.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400"
            }`}
          >
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{saveStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Information Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <User className="h-5 w-5 text-indigo-500" /> Account Profile
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-zinc-400">Email addresses cannot be modified.</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* AI Settings Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <Key className="h-5 w-5 text-purple-500" /> OpenAI API Configuration
            </h3>

            <p className="text-sm text-zinc-500 leading-relaxed">
              MindSpark generates flashcards, structured study guides, and game templates using OpenAI models. You can configure your own personal API key below.
            </p>
            
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">OpenAI API Key</label>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  placeholder={hasApiKey ? "••••••••••••••••••••" : "sk-..."}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-transparent border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors"
                />
                
                {hasApiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="flex items-center justify-center gap-2 px-5 py-3 border border-zinc-200 dark:border-zinc-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" /> Remove Key
                  </button>
                )}
              </div>
              
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-900/50 text-[11px] text-zinc-400 leading-relaxed">
                <strong>Privacy Info:</strong> Your API key is encrypted using AES-256-GCM before being saved in our local SQLite database. It is only sent directly to OpenAI endpoints when generating reviewers.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.99] transition-all disabled:opacity-50 text-white cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
