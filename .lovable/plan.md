

## Plan: Visual Polish + PWA Implementation

This plan has two tracks: (A) visual refinements to elevate the SaaS premium feel, and (B) PWA setup for installability.

---

### Track A: Visual Refinements

The system already has a solid design system (tokens, shadows, transitions, domain colors). The refinements focus on elevating specific areas.

#### 1. Color Token Refinement — `src/index.css`
- Adjust dark mode to a deeper, more "Stripe-like" dark palette (background ~`224 50% 5%`, cards ~`224 40% 8%`)
- Add subtle gradient utility: `.gradient-header` for a faint top-to-bottom gradient on page headers
- Add `.glass-surface` utility for frosted glass effect on cards/modals

#### 2. Auth Page Polish — `src/pages/Auth.tsx`
- Full-bleed dark background with subtle radial gradient
- Card with glass effect, centered logo, stronger hierarchy
- Input fields with better focus states

#### 3. Sidebar Polish — `src/components/layout/AppSidebar.tsx`
- Add subtle separator lines between groups
- Active item: brighter indicator (left accent bar instead of just bg)
- Collapsed state: tooltip improvements

#### 4. Topbar Polish — `src/components/layout/Topbar.tsx`
- Slightly taller (h-14 → h-16) with better vertical rhythm
- Search input: larger, more prominent with keyboard shortcut hint
- User avatar circle with initials instead of shield icon

#### 5. Dashboard KPI Cards — `src/pages/Dashboard.tsx`
- Add subtle top-border gradient accent per domain color
- Larger primary metric (text-3xl)
- Add trend indicator arrows (static visual, no new data)

#### 6. Table & Component Polish
- `src/components/ui/card.tsx`: Add `hover:shadow-medium` transition
- `src/components/ui/button.tsx`: Ensure consistent border-radius and shadow
- Global: Ensure all interactive elements have `duration-150` transitions

---

### Track B: PWA Implementation

#### 7. Install `vite-plugin-pwa` — `package.json` + `vite.config.ts`
- Add `vite-plugin-pwa` dependency
- Configure in vite with manifest, service worker (generateSW), and `navigateFallbackDenylist: [/^\/~oauth/, /^\/proposta/, /^\/portal/, /^\/aceite/]`

#### 8. Create PWA Manifest — via `vite-plugin-pwa` config
- `name`: "Hyon Tech"
- `short_name`: "Hyon"
- `theme_color`: "#1e40af" (primary blue)
- `background_color`: "#0a0f1a" (dark bg)
- `display`: "standalone"
- `start_url`: "/"

#### 9. Generate PWA Icons — `public/`
- Create SVG-based icons at 192x192 and 512x512 using the Hyon brand color
- Reference the existing `src/assets/logo-hyon.png` as base

#### 10. Update `index.html`
- Add `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-capable">`, `<link rel="apple-touch-icon">`
- Update `<title>` to "Hyon Tech"

#### 11. Install Banner Component — `src/components/PwaInstallBanner.tsx`
- Listens for `beforeinstallprompt` event
- Shows a subtle bottom toast/banner: "Instalar Hyon Tech" with install button
- Dismissable, remembers dismissal in localStorage
- Rendered in `App.tsx` (inside BrowserRouter, outside auth gate)

#### 12. Online/Offline Indicator — `src/components/layout/Topbar.tsx`
- Add a small dot indicator next to the user selector
- Green = online, red pulse = offline
- Uses `navigator.onLine` + `online`/`offline` event listeners

---

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/PwaInstallBanner.tsx` | PWA install prompt banner |
| `public/pwa-192x192.png` | PWA icon 192px |
| `public/pwa-512x512.png` | PWA icon 512px |

### Files to Edit
| File | Change |
|------|--------|
| `package.json` | Add `vite-plugin-pwa` |
| `vite.config.ts` | Configure PWA plugin with manifest |
| `index.html` | Meta tags, title, apple-touch-icon |
| `src/index.css` | Deeper dark palette, new utilities |
| `src/pages/Auth.tsx` | Premium login page design |
| `src/components/layout/AppSidebar.tsx` | Active indicator bar, group polish |
| `src/components/layout/Topbar.tsx` | Height, search, avatar initials, online indicator |
| `src/pages/Dashboard.tsx` | KPI card top-border accent, larger metrics |
| `src/components/ui/card.tsx` | Hover shadow transition |
| `src/App.tsx` | Render PwaInstallBanner |

No routes, data flows, or functionality changes. Pure visual + PWA infrastructure.

