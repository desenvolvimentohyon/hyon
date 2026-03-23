import { cn } from "@/lib/utils";

export type JarvisState = "idle" | "speaking" | "listening" | "processing";

interface JarvisAvatarProps {
  state?: JarvisState;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

const SIZE_MAP = {
  sm: { container: "h-8 w-8", core: "h-4 w-4", orbit: "h-6 w-6", halo: "h-8 w-8", ripple: "h-10 w-10" },
  md: { container: "h-14 w-14", core: "h-7 w-7", orbit: "h-10 w-10", halo: "h-14 w-14", ripple: "h-18 w-18" },
  lg: { container: "h-20 w-20", core: "h-10 w-10", orbit: "h-14 w-14", halo: "h-20 w-20", ripple: "h-24 w-24" },
};

export function JarvisAvatar({ state = "idle", size = "md", onClick, className }: JarvisAvatarProps) {
  const s = SIZE_MAP[size];
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const isActive = state !== "idle";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none",
        s.container,
        className
      )}
      aria-label="Jarvis IA"
    >
      {/* Halo / glow externo */}
      <span
        className={cn(
          "absolute inset-0 rounded-full",
          "bg-gradient-to-br from-primary/20 via-purple/15 to-[hsl(190_80%_50%/0.15)]",
          "animate-[jarvis-breathe_3s_ease-in-out_infinite]",
          isActive && "from-primary/35 via-purple/25 to-[hsl(190_80%_50%/0.25)]",
          "motion-reduce:animate-none"
        )}
      />

      {/* Anel orbital */}
      <span
        className={cn(
          "absolute rounded-full border",
          s.orbit,
          "border-primary/30",
          "animate-[jarvis-orbit_12s_linear_infinite]",
          isProcessing && "animate-[jarvis-orbit_3s_linear_infinite] border-primary/60",
          isSpeaking && "border-purple/50",
          isListening && "border-[hsl(190_80%_50%/0.5)]",
          "motion-reduce:animate-none"
        )}
        style={{ borderTopColor: "transparent", borderRightColor: "transparent" }}
      />

      {/* Segundo anel (contra-rotação) */}
      <span
        className={cn(
          "absolute rounded-full border",
          s.orbit,
          "border-purple/20",
          "animate-[jarvis-orbit_8s_linear_infinite_reverse]",
          isProcessing && "animate-[jarvis-orbit_2s_linear_infinite_reverse] border-purple/50",
          "motion-reduce:animate-none"
        )}
        style={{ borderBottomColor: "transparent", borderLeftColor: "transparent" }}
      />

      {/* Ondas de áudio (ripple) — visíveis ao falar */}
      {isSpeaking && (
        <>
          <span className="absolute inset-[-4px] rounded-full border border-primary/20 animate-[jarvis-ripple_1.5s_ease-out_infinite] motion-reduce:animate-none" />
          <span className="absolute inset-[-4px] rounded-full border border-purple/15 animate-[jarvis-ripple_1.5s_ease-out_infinite_0.5s] motion-reduce:animate-none" />
          <span className="absolute inset-[-4px] rounded-full border border-primary/10 animate-[jarvis-ripple_1.5s_ease-out_infinite_1s] motion-reduce:animate-none" />
        </>
      )}

      {/* Efeito de captação ao ouvir */}
      {isListening && (
        <>
          <span className="absolute inset-[-6px] rounded-full border border-[hsl(190_80%_50%/0.3)] animate-[jarvis-capture_1.2s_ease-in_infinite] motion-reduce:animate-none" />
          <span className="absolute inset-[-6px] rounded-full border border-[hsl(190_80%_50%/0.2)] animate-[jarvis-capture_1.2s_ease-in_infinite_0.4s] motion-reduce:animate-none" />
        </>
      )}

      {/* Núcleo central */}
      <span
        className={cn(
          "relative rounded-full z-10",
          s.core,
          "bg-gradient-to-br from-primary via-purple to-[hsl(190_80%_50%)]",
          "shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
          isSpeaking && "animate-[jarvis-core-pulse_0.6s_ease-in-out_infinite] shadow-[0_0_20px_hsl(var(--primary)/0.6)]",
          isListening && "shadow-[0_0_16px_hsl(190_80%_50%/0.5)]",
          isProcessing && "animate-[jarvis-core-pulse_0.4s_ease-in-out_infinite]",
          "motion-reduce:animate-none"
        )}
      />
    </button>
  );
}
