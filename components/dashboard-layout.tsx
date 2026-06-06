"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { useTheme } from "./theme-provider";
import {
  LayoutDashboard,
  Trophy,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Protected route check in case middleware didn't catch it
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-[#07070a]">
        <div className="flex flex-col items-center gap-4">
          <Image src="/icon.svg" alt="MindSpark Logo" width={64} height={64} className="animate-bounce rounded-2xl shadow-lg" unoptimized />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium animate-pulse">
            Loading your study space...
          </p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Level progression variables
  const currentXp = user.xp % 100;
  const xpNeeded = 100;
  const xpPercentage = Math.min((currentXp / xpNeeded) * 100, 100);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-[#040406] text-zinc-900 dark:text-zinc-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 glassmorphic border-r border-zinc-200 dark:border-zinc-800 sticky top-0 h-screen p-6 select-none z-20">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <Image src="/icon.svg" alt="MindSpark Logo" width={44} height={44} className="rounded-xl shadow-md shadow-indigo-500/15" unoptimized />
          <div>
            <h1 className="font-bold text-xl leading-none tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              MindSpark
            </h1>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">AI Reviewer</span>
          </div>
        </div>

        {/* User Quick Progress */}
        <div className="mb-8 p-4 rounded-2xl bg-zinc-100 dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Level {user.level}</span>
            <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {user.xp} Total XP
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-400">
            <span>{currentXp} XP</span>
            <span>{xpNeeded} XP to Level {user.level + 1}</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-l-4 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? "text-indigo-500" : "text-zinc-500"
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer logout */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-auto">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glassmorphic border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/icon.svg" alt="MindSpark Logo" width={32} height={32} className="rounded-lg shadow-sm" unoptimized />
          <span className="font-bold text-lg leading-none tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            MindSpark
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          {/* Content */}
          <div className="relative flex flex-col w-4/5 max-w-sm h-full bg-white dark:bg-[#07070a] p-6 shadow-2xl z-50">
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile User Stats */}
            <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-[#0c0c12] border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-semibold mb-1">{user.name}</p>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Level {user.level}</span>
                <span className="text-indigo-500 font-semibold">{user.xp} Total XP</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${xpPercentage}%` }} />
              </div>
            </div>

            {/* Mobile Menu Links */}
            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Logout */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-auto">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main page content area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 bg-white/70 dark:bg-[#040406]/70 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 z-10 select-none">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Welcome back,</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{user.name}! 👋</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold leading-tight">{user.name}</span>
                <span className="text-[10px] text-zinc-400 font-medium">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 md:p-8 h-full">{children}</main>
      </div>
    </div>
  );
}
