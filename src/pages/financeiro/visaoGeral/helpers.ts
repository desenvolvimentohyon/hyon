export const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtPct = (v: number) => `${v.toFixed(1)}%`;

export const statusColor = (s: string) => {
  switch (s) {
    case "pago": return "bg-success/15 text-success border-success/20";
    case "aberto": return "bg-info/15 text-info border-info/20";
    case "vencido": return "bg-destructive/15 text-destructive border-destructive/20";
    case "parcial": return "bg-warning/15 text-warning border-warning/20";
    default: return "bg-muted text-muted-foreground";
  }
};
