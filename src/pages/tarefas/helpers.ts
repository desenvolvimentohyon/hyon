import { Tarefa } from "@/types";

export function statusRowColor(status: string): string {
  switch (status) {
    case "concluida": return "bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-l-emerald-500 dark:bg-emerald-500/10";
    case "em_andamento": return "bg-blue-500/5 hover:bg-blue-500/10 border-l-4 border-l-blue-500 dark:bg-blue-500/10";
    case "aguardando_cliente": return "bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500 dark:bg-amber-500/10";
    case "a_fazer": return "bg-slate-500/5 hover:bg-slate-500/10 border-l-4 border-l-slate-400 dark:bg-slate-500/10";
    case "cancelada": return "bg-red-500/5 hover:bg-red-500/10 border-l-4 border-l-red-400 dark:bg-red-500/10";
    default: return "border-l-4 border-l-transparent";
  }
}

export const prioridadeColor = (p: string) => {
  switch (p) {
    case "urgente": return "bg-destructive text-destructive-foreground";
    case "alta": return "bg-warning text-warning-foreground";
    case "media": return "bg-info text-info-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

export const statusColor = (s: string) => {
  switch (s) {
    case "concluida": return "bg-success text-success-foreground";
    case "em_andamento": return "bg-info text-info-foreground";
    case "cancelada": return "bg-muted text-muted-foreground";
    case "aguardando_cliente": return "bg-warning text-warning-foreground";
    default: return "bg-secondary text-secondary-foreground";
  }
};

export const isAtrasada = (t: Tarefa, now: Date = new Date()) => {
  if (!t.prazoDataHora || t.status === "concluida" || t.status === "cancelada") return false;
  return new Date(t.prazoDataHora) < now;
};
