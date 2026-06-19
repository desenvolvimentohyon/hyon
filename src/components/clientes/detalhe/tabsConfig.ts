import { FileText, Calculator, DollarSign, TrendingDown, History, Receipt, Settings2, Boxes, Wallet } from "lucide-react";

export const TAB_COLORS: Record<string, { color: string; inactiveColor: string; bg: string; border: string; glow: string }> = {
  dados:          { color: "text-blue-500",   inactiveColor: "text-blue-500/50",   bg: "bg-blue-500/15",   border: "border-blue-500/30",   glow: "0 0 12px rgba(59,130,246,0.35)" },
  contabilidade:  { color: "text-emerald-500",inactiveColor: "text-emerald-500/50",bg: "bg-emerald-500/15",border: "border-emerald-500/30",glow: "0 0 12px rgba(16,185,129,0.35)" },
  mensalidade:    { color: "text-green-500",  inactiveColor: "text-green-500/50",  bg: "bg-green-500/15",  border: "border-green-500/30",  glow: "0 0 12px rgba(34,197,94,0.35)" },
  custo:          { color: "text-red-500",    inactiveColor: "text-red-500/50",    bg: "bg-red-500/15",    border: "border-red-500/30",    glow: "0 0 12px rgba(239,68,68,0.35)" },
  evolucao:       { color: "text-violet-500", inactiveColor: "text-violet-500/50", bg: "bg-violet-500/15", border: "border-violet-500/30", glow: "0 0 12px rgba(139,92,246,0.35)" },
  cobrancas:      { color: "text-orange-500", inactiveColor: "text-orange-500/50", bg: "bg-orange-500/15", border: "border-orange-500/30", glow: "0 0 12px rgba(249,115,22,0.35)" },
  controle:       { color: "text-slate-500",  inactiveColor: "text-slate-500/50",  bg: "bg-slate-500/15",  border: "border-slate-500/30",  glow: "0 0 12px rgba(100,116,139,0.35)" },
  modulos:        { color: "text-indigo-500", inactiveColor: "text-indigo-500/50", bg: "bg-indigo-500/15", border: "border-indigo-500/30", glow: "0 0 12px rgba(99,102,241,0.35)" },
  pagamentos:     { color: "text-teal-500",   inactiveColor: "text-teal-500/50",   bg: "bg-teal-500/15",   border: "border-teal-500/30",   glow: "0 0 12px rgba(20,184,166,0.35)" },
};

export const TABS = [
  { value: "dados", label: "Dados", icon: FileText },
  { value: "contabilidade", label: "Contabilidade", icon: Calculator },
  { value: "mensalidade", label: "Mensalidade", icon: DollarSign },
  { value: "custo", label: "Custo", icon: TrendingDown },
  { value: "evolucao", label: "Evolução", icon: History },
  { value: "cobrancas", label: "Cobranças", icon: Receipt },
  { value: "controle", label: "Controle", icon: Settings2 },
  { value: "modulos", label: "Módulos", icon: Boxes },
  { value: "pagamentos", label: "Pagamentos", icon: Wallet },
];
