// Lightweight click tracking + UTM helpers for marketing conversions.
// No external SDK required — integrates with GTM/GA4/Meta Pixel when present.

export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landing_page?: string;
};

const STORAGE_KEY = "hyon_first_touch";
const UTM_KEYS: (keyof UtmParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
];

function isBrowser() {
  return typeof window !== "undefined";
}

/** Reads UTM from current URL and persists first-touch attribution. */
export function getUtmParams(): UtmParams {
  if (!isBrowser()) return {};
  const url = new URL(window.location.href);
  const current: UtmParams = {};
  UTM_KEYS.forEach((k) => {
    const v = url.searchParams.get(k);
    if (v) (current as any)[k] = v;
  });

  // First-touch attribution
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored && (Object.keys(current).length > 0 || document.referrer)) {
      const first: UtmParams = {
        ...current,
        referrer: document.referrer || undefined,
        landing_page: window.location.pathname + window.location.search,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(first));
      return first;
    }
    if (stored) {
      const parsed = JSON.parse(stored) as UtmParams;
      // Current URL utm still wins for last-touch fields
      return { ...parsed, ...current };
    }
  } catch {
    // storage indisponível — segue apenas com current
  }
  return current;
}

/** Default UTM added to outbound WhatsApp links when nothing is provided. */
export function defaultWhatsAppUtm(source: string): UtmParams {
  return {
    utm_source: "site_hyon",
    utm_medium: "whatsapp",
    utm_campaign: "landing_page",
    utm_content: source,
  };
}

/**
 * Builds a WhatsApp deep-link with UTM appended to the message text.
 * WhatsApp strips URL query params on wa.me, so UTM is embedded in the message.
 */
export function buildWhatsAppLink(opts: {
  phone: string; // digits only, com DDI
  message: string;
  source: string;
}) {
  const utm = { ...defaultWhatsAppUtm(opts.source), ...getUtmParams() };
  const tag = `\n\n[ref: ${utm.utm_source ?? "-"}/${utm.utm_medium ?? "-"}/${utm.utm_campaign ?? "-"}/${opts.source}]`;
  const text = `${opts.message}${tag}`;
  return `https://wa.me/${opts.phone}?text=${encodeURIComponent(text)}`;
}

/** Fires a WhatsApp click event to every analytics layer that is loaded. */
export function trackWhatsAppClick(source: string, extra: Record<string, unknown> = {}) {
  if (!isBrowser()) return;
  const utm = getUtmParams();
  const payload = {
    event: "whatsapp_click",
    event_category: "engagement",
    event_label: source,
    source,
    page_path: window.location.pathname,
    page_url: window.location.href,
    timestamp: new Date().toISOString(),
    ...utm,
    ...extra,
  };

  try {
    // Google Tag Manager
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push(payload);
  } catch { /* noop */ }

  try {
    // Google Analytics 4 (gtag.js)
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", "whatsapp_click", payload);
      // Marca também como conversion genérica
      gtag("event", "generate_lead", { method: "whatsapp", value: 1, ...payload });
    }
  } catch { /* noop */ }

  try {
    // Meta Pixel
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      fbq("track", "Contact", { source, ...utm });
      fbq("trackCustom", "WhatsAppClick", payload);
    }
  } catch { /* noop */ }

  try {
    // Custom event para listeners internos
    window.dispatchEvent(new CustomEvent("whatsapp_click", { detail: payload }));
  } catch { /* noop */ }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info("[tracking] whatsapp_click", payload);
  }
}
