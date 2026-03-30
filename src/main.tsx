import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import { PwaUpdateBanner } from "./components/PwaUpdateBanner.tsx";
import "./index.css";

const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

let showUpdateBanner: ((v: boolean) => void) | null = null;
let updateSW: (() => Promise<void>) | undefined;

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
} else {
  updateSW = registerSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Poll for updates every 60s — critical for Safari/iOS
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 1000);
      }
    },
    onNeedRefresh() {
      showUpdateBanner?.(true);
      // Fast reload for immediate update
      setTimeout(async () => {
        try {
          await updateSW?.();
        } catch { /* ignore */ }
        window.location.reload();
      }, 500);
    },
  });
}

function Root() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  showUpdateBanner = setNeedsUpdate;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <App />
      {needsUpdate && (
        <PwaUpdateBanner
          onUpdate={async () => {
            try { await updateSW?.(); } catch {}
            window.location.reload();
          }}
          onDismiss={() => setNeedsUpdate(false)}
        />
      )}
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
