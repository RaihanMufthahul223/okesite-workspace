"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

// iOS detection helper
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}
function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function PWAInstallBanner() {
  const [deferred, setDeferred] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOSStandalone, setIsIOSStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(localStorage.getItem("pwa-banner-dismissed") === "1");
    setIsIOSStandalone(isStandalone());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setDeferred(null);
      setDismissed(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isIOSStandalone) return null;
  if (dismissed) return null;

  const showAndroid = !!deferred;
  const showIOS = !deferred && isIOS() && !isStandalone();

  if (!showAndroid && !showIOS) return null;

  function handleDismiss() {
    localStorage.setItem("pwa-banner-dismissed", "1");
    setDismissed(true);
  }

  async function handleInstall() {
    if (!deferred) return;
    const prompt = deferred as unknown as { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setDeferred(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-4 md:left-auto md:right-4 md:w-[360px] pointer-events-none">
      <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 leading-tight">Install OkeSite CRM</p>
            {showAndroid ? (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Akses cepat tanpa buka browser. Install ke layar utama HP.</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tap <span className="inline-flex items-center gap-1 font-semibold text-slate-700"><Share className="w-3 h-3" /> Share</span> → <span className="font-semibold text-slate-700">Add to Home Screen</span>
              </p>
            )}
          </div>
          <button type="button" onClick={handleDismiss} aria-label="Tutup" className="shrink-0 p-1.5 -mr-1 -mt-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 pb-4">
          <Button onClick={handleDismiss} variant="ghost" size="sm" className="flex-1 rounded-xl">Nanti</Button>
          {showAndroid ? (
            <Button onClick={handleInstall} size="sm" className="flex-1 gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="w-4 h-4" /> Install
            </Button>
          ) : (
            <Button onClick={handleDismiss} size="sm" className="flex-1 gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              Mengerti
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Cloudflare Pages serves /sw.js from public
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Check for updates hourly
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        // Prompt reload when new SW waiting
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              // New version available — could show toast; keep silent for now
            }
          });
        });
      } catch (e) {
        console.warn("[PWA] SW register failed", e);
      }
    };
    // Delay to not block first paint
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
