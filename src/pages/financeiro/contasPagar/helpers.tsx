import { Badge } from "@/components/ui/badge";
import { STATUS_TITULO_LABELS, TituloFinanceiro } from "@/types/financeiro";

export const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const statusBadge = (status: string) => {
  const variants: Record<string, string> = {
    aberto: "bg-info/10 text-info border-info/20",
    pago: "bg-success/10 text-success border-success/20",
    parcial: "bg-warning/10 text-warning border-warning/20",
    vencido: "bg-destructive/10 text-destructive border-destructive/20",
    cancelado: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={variants[status] || ""}>{STATUS_TITULO_LABELS[status as keyof typeof STATUS_TITULO_LABELS]}</Badge>;
};

export const getFuturosRecorrentes = (titulos: TituloFinanceiro[], tituloId: string) => {
  const titulo = titulos.find(t => t.id === tituloId);
  if (!titulo) return [];
  const baseDesc = titulo.descricao.replace(/\s*\(recorrente \d+\/\d+\)/, "");
  return titulos.filter(t =>
    t.id !== tituloId &&
    t.status === "aberto" &&
    t.descricao.replace(/\s*\(recorrente \d+\/\d+\)/, "") === baseDesc &&
    t.descricao.includes("(recorrente") &&
    t.vencimento > titulo.vencimento
  );
};
