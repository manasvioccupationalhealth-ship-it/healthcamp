"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Tablet } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Service Worker registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Detect if already running as installed PWA app
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);

      // Detect iOS / iPadOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setIsIos(isAppleDevice && !standalone);
    }

    // 3. Capture beforeinstallprompt event for Android / Tablets
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user previously dismissed banner
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Android / Tablet PWA Prompt Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="bg-slate-900 text-white px-4 py-2.5 sm:px-6 shadow-md border-b border-slate-800 flex items-center justify-between z-40 transition-all">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Tablet className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Install HealthCamp on Tablet / Mobile</p>
              <p className="text-[10px] text-slate-300">Fast, offline-capable medical workstation app</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-xs transition flex items-center space-x-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded transition"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Tablet Helper Note */}
      {isIos && !localStorage.getItem("ios_pwa_dismissed") && (
        <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs z-40">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-200">
              <strong>iPad / iPhone:</strong> Tap <strong>Share</strong> then <strong>&ldquo;Add to Home Screen&rdquo;</strong> to install the full workstation app.
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("ios_pwa_dismissed", "true");
              setIsIos(false);
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
