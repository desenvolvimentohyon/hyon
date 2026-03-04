import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("pwa-banner-dismissed") === "true");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border rounded-xl px-4 py-3 shadow-elevated animate-in slide-in-from-bottom-4 duration-300">
      <Download className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Instalar Hyon Tech</p>
        <p className="text-xs text-muted-foreground">Use como app no seu dispositivo</p>
      </div>
      <Button size="sm" onClick={handleInstall} className="rounded-lg shrink-0">
        Instalar
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleDismiss}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
