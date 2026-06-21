import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Etapa {
  numero: number;
  titulo: string;
  concluida: boolean;
}

interface PropostaProgressoProps {
  etapas: Etapa[];
}

export function PropostaProgresso({ etapas }: PropostaProgressoProps) {
  const concluidas = etapas.filter((e) => e.concluida).length;
  const total = etapas.length;
  const percent = Math.round((concluidas / total) * 100);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold">Progresso da proposta</p>
          <p className="text-xs text-muted-foreground">
            {concluidas} de {total} etapas preenchidas
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary leading-none">{percent}%</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {etapas.map((etapa, idx) => (
          <div key={etapa.numero} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                  etapa.concluida
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground border border-border"
                )}
              >
                {etapa.concluida ? <Check className="h-3.5 w-3.5" /> : etapa.numero}
              </div>
              <span
                className={cn(
                  "text-[10px] text-center leading-tight max-w-[64px] truncate hidden sm:block",
                  etapa.concluida ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {etapa.titulo}
              </span>
            </div>
            {idx < etapas.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-1 transition-colors",
                  etapa.concluida ? "bg-emerald-500/40" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
