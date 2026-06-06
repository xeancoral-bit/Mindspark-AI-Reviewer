"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share2, PlusSquare, Smartphone, Sparkles } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const checkStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(checkStandalone);

    // 2. Check if dismissed recently
    const isDismissed = localStorage.getItem("ms_pwa_prompt_dismissed");

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIos = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(detectIos);

    // If already installed or dismissed, don't show the prompt
    if (checkStandalone || isDismissed) {
      return;
    }

    // 4. Listen for Chrome/Android's install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. For iOS, we can show instructions manually since there's no native prompt event
    if (detectIos) {
      // Delay iOS prompt slightly to not overwhelm the user on first load
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger native browser install prompt
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    // Save dismissal for 7 days
    localStorage.setItem("ms_pwa_prompt_dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:max-w-md z-50 animate-fade-in-scale">
      <div className="glassmorphic rounded-3xl p-5 border border-indigo-500/20 shadow-2xl relative bg-[#09090b]/90 text-white overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />
        
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex gap-4 items-start pr-6">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl shrink-0">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-sm text-zinc-100">Install MindSpark App</h4>
              <span className="flex items-center gap-0.5 text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold border border-indigo-500/25">
                <Sparkles className="h-2.5 w-2.5" /> Mobile
              </span>
            </div>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              Add MindSpark to your home screen to study offline, earn achievements, and access full-screen study modes.
            </p>
          </div>
        </div>

        {/* Action / Instructions */}
        <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-end">
          {isIos ? (
            /* iOS Custom Instruction Tooltip */
            <div className="w-full text-zinc-400 text-[11px] leading-relaxed flex flex-col gap-1.5">
              <span className="font-bold text-zinc-300">How to download on iOS:</span>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Tap the share icon <Share2 className="h-3 w-3 inline text-indigo-400" /> in Safari.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Select <PlusSquare className="h-3 w-3 inline text-indigo-400" /> <strong className="text-zinc-200">&quot;Add to Home Screen&quot;</strong>.</span>
              </div>
            </div>
          ) : (
            /* Android / Chrome Native Install Trigger */
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold text-xs shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-white cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
