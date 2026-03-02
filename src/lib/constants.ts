import { TipoOperacional, TemplateImplantacao } from "@/types";
import { TrendingUp, Rocket, Headphones, GraduationCap, DollarSign, Building } from "lucide-react";

export const TIPO_OPERACIONAL_CONFIG: Record<TipoOperacional, { label: string; color: string; bgClass: string; icon: typeof TrendingUp }> = {
  comercial:    { label: "Comercial",    color: "text-blue-600",   bgClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",   icon: TrendingUp },
  implantacao:  { label: "Implantação",  color: "text-purple-600", bgClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", icon: Rocket },
  suporte:      { label: "Suporte",      color: "text-orange-600", bgClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300", icon: Headphones },
  treinamento:  { label: "Treinamento",  color: "text-emerald-600",bgClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", icon: GraduationCap },
  financeiro:   { label: "Financeiro",   color: "text-red-600",    bgClass: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",       icon: DollarSign },
  interno:      { label: "Interno",      color: "text-gray-600",   bgClass: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",   icon: Building },
};

export const TEMPLATES_IMPLANTACAO: TemplateImplantacao[] = [
  {
    id: "tmpl1",
    nome: "Hyon Alimentação",
    sistemaRelacionado: "hyon",
    etapas: [
      { texto: "Cadastro de produtos", responsavelPadraoId: "t1" },
      { texto: "Configuração fiscal", responsavelPadraoId: "t2" },
      { texto: "Configuração TEF", responsavelPadraoId: "t1" },
      { texto: "Instalação equipamentos", responsavelPadraoId: "t3" },
      { texto: "Treinamento equipe venda", responsavelPadraoId: "t2" },
      { texto: "Treinamento administrativo", responsavelPadraoId: "t2" },
    ],
  },
  {
    id: "tmpl2",
    nome: "LinkPro Varejo",
    sistemaRelacionado: "linkpro",
    etapas: [
      { texto: "Cadastro de produtos e estoque", responsavelPadraoId: "t1" },
      { texto: "Configuração fiscal e NF-e", responsavelPadraoId: "t2" },
      { texto: "Configuração financeiro", responsavelPadraoId: "t3" },
      { texto: "Configuração relatórios", responsavelPadraoId: "t1" },
      { texto: "Treinamento operacional", responsavelPadraoId: "t2" },
    ],
  },
];

export const SLA_KEYWORDS: { keywords: string[]; prioridade: "urgente" | "alta" }[] = [
  { keywords: ["não abre", "parou", "travou", "erro fiscal", "não funciona", "sistema caiu"], prioridade: "urgente" },
  { keywords: ["lento", "erro", "problema", "falha", "não imprime"], prioridade: "alta" },
];

export function suggestPrioridade(descricao: string): "urgente" | "alta" | "media" {
  const lower = descricao.toLowerCase();
  for (const rule of SLA_KEYWORDS) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.prioridade;
  }
  return "media";
}

export function calcularScoreSaude(
  chamadosCount: number,
  statusFinanceiro: string | undefined,
  tempoMedioResolucaoHoras: number
): number {
  let score = 100;
  // Chamados: -5 por chamado
  score -= chamadosCount * 5;
  // Financeiro
  if (statusFinanceiro === "1_atraso") score -= 15;
  if (statusFinanceiro === "2_mais_atrasos") score -= 35;
  // Tempo resolução: -2 por hora acima de 4h
  if (tempoMedioResolucaoHoras > 4) score -= (tempoMedioResolucaoHoras - 4) * 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreSaudeLabel(score: number): { label: string; className: string } {
  if (score >= 70) return { label: "Saudável", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" };
  if (score >= 40) return { label: "Atenção", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" };
  return { label: "Risco Alto", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" };
}
