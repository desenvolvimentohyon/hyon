import { useEffect, useRef, useState, ReactNode, HTMLAttributes } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";

/* ---------- Global animated backdrop ---------- */
export function CinematicBackdrop() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Aurora blobs */}
      <div className="absolute -top-40 -left-40 w-[620px] h-[620px] rounded-full bg-[#2563EB]/30 blur-[140px] cine-aurora" />
      <div
        className="absolute top-1/3 -right-40 w-[620px] h-[620px] rounded-full bg-[#7C3AED]/30 blur-[140px] cine-aurora"
        style={{ animationDelay: "-8s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[520px] h-[520px] rounded-full bg-[#06B6D4]/25 blur-[140px] cine-aurora"
        style={{ animationDelay: "-14s" }}
      />
      {/* Grid */}
      <div className="absolute inset-0 cine-grid" />
      {/* Noise */}
      <div className="absolute inset-0 cine-noise" />
      {/* Particles */}
      {!reduce && <ParticleField count={22} />}
    </div>
  );
}

function ParticleField({ count = 20 }: { count?: number }) {
  const parts = Array.from({ length: count }).map((_, i) => {
    const left = (i * 97) % 100;
    const size = 1 + ((i * 13) % 4);
    const dur = 14 + ((i * 7) % 18);
    const delay = (i * 1.7) % 12;
    const hue = ["#60A5FA", "#A78BFA", "#22D3EE", "#ffffff"][i % 4];
    return { left, size, dur, delay, hue, id: i };
  });
  return (
    <div className="absolute inset-0">
      {parts.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-[-10vh] rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.hue,
            boxShadow: `0 0 ${p.size * 6}px ${p.hue}`,
            animation: `particle-drift ${p.dur}s linear ${p.delay}s infinite`,
            opacity: 0.65,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Cursor spotlight ---------- */
export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          if (ref.current) ref.current.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
          raf = 0;
        });
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);
  if (reduce) return null;
  return <div ref={ref} className="cine-spotlight" aria-hidden />;
}

/* ---------- Reveal on scroll ---------- */
type RevealProps = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "span";
  delay?: number;
  y?: number;
  children: ReactNode;
};
export function Reveal({ as = "div", delay = 0, y = 24, children, className, ...rest }: RevealProps) {
  const MotionTag = motion[as] as any;
  return (
    <MotionTag
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/* ---------- Word-by-word text reveal ---------- */
export function TextReveal({
  text,
  className,
  as: Tag = "h1",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: any;
  delay?: number;
}) {
  const words = text.split(" ");
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: delay } },
  };
  const child: Variants = {
    hidden: { y: "110%", opacity: 0, filter: "blur(6px)" },
    show: { y: "0%", opacity: 1, filter: "blur(0px)", transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
  };
  return (
    <Tag className={className}>
      <motion.span variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} className="inline">
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.28em]">
            <motion.span variants={child} className="inline-block will-change-transform"
              // preserve gradient span inside
              dangerouslySetInnerHTML={{ __html: w }}
            />
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

/* ---------- 3D tilt card ---------- */
export function TiltCard({
  children,
  className = "",
  intensity = 8,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -intensity;
    const ry = (px - 0.5) * intensity;
    ref.current.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    ref.current.style.setProperty("--mx", `${px * 100}%`);
    ref.current.style.setProperty("--my", `${py * 100}%`);
  };
  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative cine-card-3d ${className}`}
    >
      {children}
      <span className="cine-shine" />
    </div>
  );
}

/* ---------- Splash / loading screen ---------- */
export function SplashScreen({ logoUrl }: { logoUrl: string }) {
  const [gone, setGone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1500);
    const t2 = setTimeout(() => setGone(true), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  if (gone) return null;
  return (
    <div
      className={`fixed inset-0 z-[200] bg-[#050609] grid place-items-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#2563EB]/40 blur-[140px] cine-aurora" />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-[#7C3AED]/40 blur-[140px] cine-aurora" style={{ animationDelay: "-6s" }} />
        <div className="absolute inset-0 cine-grid opacity-40" />
      </div>
      <div className="relative flex flex-col items-center gap-6">
        <img
          src={logoUrl}
          alt="Hyon Tecnologia"
          className="h-20 sm:h-24 w-auto"
          style={{ animation: "splash-logo 900ms cubic-bezier(.2,.7,.2,1) both" }}
        />
        <div className="w-56 h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#60A5FA] via-[#A78BFA] to-[#22D3EE]"
            style={{ animation: "splash-bar 1.6s cubic-bezier(.6,.05,.2,1) forwards" }}
          />
        </div>
        <div className="text-[11px] tracking-[0.35em] uppercase text-slate-400">Carregando experiência</div>
      </div>
    </div>
  );
}

/* ---------- Magnetic wrapper (buttons/CTA) ---------- */
export function Magnetic({ children, strength = 0.25, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`inline-block transition-transform duration-200 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
