

## Glassmorphism Login Redesign

### Overview
Pure visual redesign of `src/pages/Auth.tsx` -- no auth logic, routes, or state changes. Only the JSX/CSS styling changes.

### Changes (single file: `src/pages/Auth.tsx`)

**1. Background Layer**
- Multi-layer radial gradient: deep navy (#030712) base with two colored orbs (blue at top-left, teal/cyan at bottom-right)
- Animated floating glow orbs using CSS `@keyframes` via inline styles (slow drift animation, 8-15s)
- Subtle noise/grid overlay kept but refined

**2. Glass Card**
- Replace `glass-surface` with custom inline glass styles:
  - `background: rgba(255,255,255,0.03)` (dark glass)
  - `backdrop-filter: blur(24px) saturate(1.2)`
  - `border: 1px solid rgba(255,255,255,0.08)`
  - Top highlight: `border-top: 1px solid rgba(255,255,255,0.12)` for light refraction effect
  - `box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`
- Rounded corners `rounded-2xl`, generous padding

**3. Inputs with Icons**
- Wrap each input in a relative container
- Add `Mail` and `Lock` icons from lucide-react (positioned absolute left)
- Input styling: `bg-white/[0.04]`, `border-white/[0.08]`, `pl-10` for icon space
- Focus state: blue glow ring `focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]`

**4. Primary Button**
- Gradient background: `bg-gradient-to-r from-blue-600 to-blue-500`
- Hover: brighter gradient + elevated shadow `hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]`
- Transition 150ms

**5. Social Buttons**
- Glass style: `bg-white/[0.04] border-white/[0.08]`
- Hover: `bg-white/[0.08]`

**6. Floating Orbs (Background Decoration)**
- 3 absolutely positioned divs with large blur radius (`blur-[120px]`)
- Colors: blue, cyan/teal, purple -- low opacity (0.15-0.2)
- Slow CSS animation (translate + scale) for organic movement
- Hidden on mobile via `hidden md:block` for performance

**7. Responsive**
- Mobile: card full-width with margin, orbs hidden, simpler background
- Desktop: centered card with full visual effects

### Technical Notes
- All changes confined to `Auth.tsx` -- uses inline styles + Tailwind classes only
- No new CSS classes in `index.css` needed (inline keyframes via `style` tags)
- Imports added: `Mail`, `Lock` from lucide-react
- Zero changes to auth logic, handlers, or component structure

