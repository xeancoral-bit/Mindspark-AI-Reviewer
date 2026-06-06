"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard-layout";
import { Trophy, Award, GraduationCap, Brain, Zap, Crown, Star, Sparkles, Loader2, Gem } from "lucide-react";

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  xp: number;
  level: number;
  badgeCount: number;
  isCurrentUser: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpRequired: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<{ rank: number; name: string; xp: number; level: number } | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
          setCurrentUserRank(data.currentUserRank);
          setBadges(data.badges);
        }
      })
      .catch((err) => console.error("Error loading leaderboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const getBadgeIcon = (iconName: string, active: boolean) => {
    const props = { className: `h-8 w-8 ${active ? "text-indigo-400" : "text-zinc-500"}` };
    switch (iconName) {
      case "Award":
        return <Award {...props} />;
      case "GraduationCap":
        return <GraduationCap {...props} />;
      case "Brain":
        return <Brain {...props} />;
      case "Zap":
        return <Zap {...props} />;
      case "Crown":
        return <Crown {...props} />;
      case "Gem":
        return <Gem {...props} />;
      default:
        return <Star {...props} />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading Leaderboard rankings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Split top 3 and others
  const topThree = leaderboard.filter((u) => u.rank <= 3);
  const runnersUp = leaderboard.filter((u) => u.rank > 3);

  // Sort top 3 as: Rank 2, Rank 1, Rank 3 for the visual podium
  const podium = [...topThree].sort((a, b) => {
    const mapping = { 1: 2, 2: 1, 3: 3 }; // Rank 1 is middle (index 2), Rank 2 is left (index 1), Rank 3 is right (index 3)
    return (mapping[a.rank as 1|2|3] || 99) - (mapping[b.rank as 1|2|3] || 99);
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Arena & Achievements</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            See where you stand globally, earn study XP, and unlock milestone achievement badges.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Leaderboard Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm space-y-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="h-5.5 w-5.5 text-amber-500" /> Global Leaderboard
              </h3>

              {/* Visual Podium for Top 3 */}
              {topThree.length > 0 && (
                <div className="flex items-end justify-center gap-2.5 sm:gap-8 pt-10 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                  {podium.map((user) => {
                    const isFirst = user.rank === 1;
                    const isSecond = user.rank === 2;
                    const heightClass = isFirst ? "h-28 sm:h-36" : isSecond ? "h-20 sm:h-28" : "h-16 sm:h-24";
                    const colorClass = isFirst
                      ? "from-amber-400 to-yellow-600 shadow-amber-500/20"
                      : isSecond
                      ? "from-slate-300 to-slate-500 shadow-slate-400/20"
                      : "from-amber-600 to-amber-800 shadow-amber-700/20";
                    
                    return (
                      <div key={user.id} className="flex flex-col items-center flex-1 max-w-[90px] sm:max-w-[120px]">
                        {/* Avatar */}
                        <div className="relative mb-2 sm:mb-3 group">
                          {isFirst && (
                            <Crown className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 h-5 w-5 sm:h-6 sm:w-6 text-amber-400 animate-bounce" />
                          )}
                          <div className={`h-11 w-11 sm:h-16 sm:w-16 rounded-full bg-gradient-to-tr ${
                            user.isCurrentUser ? "from-indigo-500 to-purple-600 ring-2 sm:ring-4 ring-indigo-500/50" : "from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900"
                          } flex items-center justify-center font-bold text-sm sm:text-lg text-zinc-900 dark:text-zinc-100 shadow-md group-hover:scale-105 transition-transform`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[8px] sm:text-[10px] font-extrabold text-zinc-300">
                            {user.rank}
                          </div>
                        </div>

                        {/* Name and XP */}
                        <div className="text-center mb-2 sm:mb-3">
                          <p className="text-[10px] sm:text-xs font-bold truncate max-w-[65px] sm:max-w-[90px]">{user.name}</p>
                          <p className="text-[8px] sm:text-[10px] text-zinc-400 font-semibold">{user.xp} XP</p>
                        </div>

                        {/* Podium Block */}
                        <div className={`w-full bg-gradient-to-b ${colorClass} rounded-t-xl flex flex-col items-center justify-center shadow-lg ${heightClass}`}>
                          <span className="text-base sm:text-2xl font-black text-white/90">{user.rank}</span>
                          <span className="text-[8px] sm:text-[9px] text-white/70 font-semibold uppercase tracking-wider">Lvl {user.level}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Runners-Up Rankings Table */}
              <div className="space-y-2.5">
                {runnersUp.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                      user.isCurrentUser
                        ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-bold"
                        : "bg-transparent border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-black text-zinc-400 dark:text-zinc-500">
                        {user.rank}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-600 dark:text-zinc-400">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-sm truncate max-w-[150px]">{user.name}</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-bold">
                      <span className="text-zinc-400 font-semibold">Lvl {user.level}</span>
                      <span>{user.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Current User Rank Sticky Footer */}
              {currentUserRank && currentUserRank.rank > 10 && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 font-bold shadow-md mt-6">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-black">{currentUserRank.rank}</span>
                    <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase">
                      {currentUserRank.name.charAt(0)}
                    </div>
                    <span className="text-sm">You ({currentUserRank.name})</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <span className="text-indigo-400/80 font-semibold">Lvl {currentUserRank.level}</span>
                    <span>{currentUserRank.xp} XP</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Badges / Achievements Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="h-5.5 w-5.5 text-indigo-500" /> Milestone Badges
              </h3>
              
              <p className="text-sm text-zinc-500 leading-relaxed">
                Complete study assessment sets and score high to unlock badges. Unlocked badges display in color and show your milestone date.
              </p>

              <div className="space-y-4">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                      badge.unlocked
                        ? "bg-indigo-500/[0.02] border-indigo-500/10"
                        : "bg-transparent border-zinc-100 dark:border-zinc-900 opacity-60 grayscale"
                    }`}
                  >
                    <div className={`p-3.5 rounded-2xl ${
                      badge.unlocked
                        ? "bg-indigo-500/10 text-indigo-400 shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"
                    } shrink-0`}>
                      {getBadgeIcon(badge.icon, badge.unlocked)}
                    </div>
                    
                    <div className="space-y-1 text-left flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm leading-none">{badge.name}</h4>
                        {badge.unlocked && badge.unlockedAt && (
                          <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
                        {badge.description}
                      </p>
                      {badge.unlocked && badge.unlockedAt && (
                        <p className="text-[9px] text-zinc-400 pt-1">
                          Achieved on {new Date(badge.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
