import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export const LiveTimer = React.memo(({ tempoTotalSegundos, timerRodando, timerInicioTimestamp }: { tempoTotalSegundos: number; timerRodando: boolean; timerInicioTimestamp?: number }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!timerRodando) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timerRodando]);

  const elapsed = timerRodando && timerInicioTimestamp ? Math.floor((now - timerInicioTimestamp) / 1000) : 0;
  const total = tempoTotalSegundos + elapsed;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums">
      {timerRodando && <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />}
      <Clock className="h-3 w-3 text-muted-foreground" />
      {formatted}
    </span>
  );
});

LiveTimer.displayName = "LiveTimer";
