"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  xp: number;
  level: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async (opts?: { background?: boolean }) => {
    try {
      // Serve from cache instantly on first load to eliminate perceived lag
      if (!opts?.background) {
        const cached = sessionStorage.getItem("ms_user");
        if (cached) {
          setUser(JSON.parse(cached));
          setLoading(false);
          // Still re-validate in background silently
          fetchUser({ background: true });
          return;
        }
      }

      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user) {
          sessionStorage.setItem("ms_user", JSON.stringify(data.user));
        } else {
          sessionStorage.removeItem("ms_user");
        }
      } else {
        setUser(null);
        sessionStorage.removeItem("ms_user");
      }
    } catch (err) {
      console.error("Failed to fetch user session:", err);
      setUser(null);
      sessionStorage.removeItem("ms_user");
    } finally {
      if (!opts?.background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed." };
      }
      
      setUser(data.user);
      sessionStorage.setItem("ms_user", JSON.stringify(data.user));
      router.push("/dashboard");
      return { success: true };
    } catch (err) {
      console.error("Login request failed:", err);
      return { success: false, error: "An unexpected network error occurred." };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed." };
      }

      setUser(data.user);
      sessionStorage.setItem("ms_user", JSON.stringify(data.user));
      router.push("/dashboard");
      return { success: true };
    } catch (err) {
      console.error("Registration request failed:", err);
      return { success: false, error: "An unexpected network error occurred." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      sessionStorage.removeItem("ms_user");
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Refreshing user failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
