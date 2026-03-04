// Domain color helpers for consistent semantic coloring across the system
// All colors reference CSS tokens defined in index.css

export type DomainKey = "receita" | "mrr" | "custos" | "lucro" | "margem" | "churn" | "atraso" | "banco" | "suporte" | "implantacao" | "comercial";

const DOMAIN_BADGE_MAP: Record<DomainKey, string> = {
  receita: "bg-primary/10 text-primary border-primary/20",
  mrr: "bg-primary/10 text-primary border-primary/20",
  custos: "bg-destructive/10 text-destructive border-destructive/20",
  lucro: "bg-success/10 text-success border-success/20",
  margem: "bg-success/10 text-success border-success/20",
  churn: "bg-warning/10 text-warning border-warning/20",
  atraso: "bg-warning/10 text-warning border-warning/20",
  banco: "bg-purple/10 text-purple border-purple/20",
  suporte: "bg-info/10 text-info border-info/20",
  implantacao: "bg-purple/10 text-purple border-purple/20",
  comercial: "bg-primary/10 text-primary border-primary/20",
};

const DOMAIN_BORDER_MAP: Record<DomainKey, string> = {
  receita: "border-l-primary",
  mrr: "border-l-primary",
  custos: "border-l-destructive",
  lucro: "border-l-success",
  margem: "border-l-success",
  churn: "border-l-warning",
  atraso: "border-l-warning",
  banco: "border-l-purple",
  suporte: "border-l-info",
  implantacao: "border-l-purple",
  comercial: "border-l-primary",
};

export function domainBadgeClass(domain: DomainKey): string {
  return DOMAIN_BADGE_MAP[domain] || "";
}

export function domainBorderClass(domain: DomainKey): string {
  return DOMAIN_BORDER_MAP[domain] || "";
}
