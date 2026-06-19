import { ThumbsUp, ThumbsDown, Minus, Trophy, Medal, Award } from "lucide-react";

export const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

export const rankIcons = [Trophy, Medal, Award];
export const rankColors = ["text-yellow-500", "text-muted-foreground", "text-amber-700"];

export const satisfacaoLabel = (score: number) => {
  if (score >= 80) return { label: "Excelente", icon: ThumbsUp, color: "text-emerald-600" };
  if (score >= 60) return { label: "Bom", icon: Minus, color: "text-yellow-600" };
  return { label: "Crítico", icon: ThumbsDown, color: "text-destructive" };
};

export const getSlaStatus = (t: { slaHoras?: number | null; criadoEm?: string; status: string }) => {
  if (!t.slaHoras || !t.criadoEm) return null;
  const now = new Date();
  const deadline = new Date(new Date(t.criadoEm).getTime() + t.slaHoras * 3600000);
  const remaining = deadline.getTime() - now.getTime();
  if (t.status === "concluida") return { label: "OK", class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" };
  if (remaining < 0) return { label: "Vencido", class: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" };
  const hoursLeft = Math.ceil(remaining / 3600000);
  if (hoursLeft <= 2) return { label: `${hoursLeft}h restante`, class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" };
  return { label: `${hoursLeft}h restante`, class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" };
};
