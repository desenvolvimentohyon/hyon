import {
  LayoutDashboard, Users, TrendingUp, Headphones, BarChart3, FileText, Kanban,
  DollarSign, Landmark, CreditCard, FolderTree, ArrowLeftRight, BookOpen, BarChart2,
  SlidersHorizontal, Shield, Settings, Wrench, Rocket, Handshake, ShoppingCart,
  Receipt, ListTodo, Gauge
} from "lucide-react";

export interface SubModule {
  title: string;
  url: string;
  icon: React.ElementType;
  description?: string;
}

export interface ParentModule {
  id: string;
  title: string;
  icon: React.ElementType;
  children: SubModule[];
  directUrl?: string;
}

export const modules: ParentModule[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    directUrl: "/",
    children: [
      { title: "Visão Geral", url: "/", icon: LayoutDashboard, description: "Indicadores e resumo geral" },
      { title: "Modo Cockpit", url: "/cockpit", icon: Gauge, description: "Central de comando com KPIs" },
      { title: "Painel Executivo", url: "/executivo", icon: BarChart3, description: "Métricas estratégicas e KPIs" },
      { title: "Radar de Crescimento", url: "/radar-crescimento", icon: Rocket, description: "Métricas de crescimento" },
    ],
  },
  {
    id: "clientes",
    title: "Clientes e Receita",
    icon: Users,
    directUrl: "/clientes",
    children: [
      { title: "Cadastro de Clientes", url: "/clientes", icon: Users, description: "Gestão e cadastro de clientes" },
      { title: "Receita / MRR", url: "/receita", icon: DollarSign, description: "Receita recorrente mensal" },
      { title: "Checkout Interno", url: "/checkout-interno", icon: ShoppingCart, description: "Vendas e onboarding rápido" },
    ],
  },
  {
    id: "comercial",
    title: "Comercial",
    icon: TrendingUp,
    directUrl: "/propostas",
    children: [
      { title: "Propostas", url: "/propostas", icon: FileText, description: "Criação e envio de propostas" },
      { title: "CRM", url: "/crm", icon: Kanban, description: "Pipeline e funil de vendas" },
      { title: "Painel Comercial", url: "/comercial", icon: TrendingUp, description: "Leads e oportunidades" },
      { title: "Parceiros", url: "/parceiros", icon: Handshake, description: "Gestão de parceiros e comissões" },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    icon: Landmark,
    directUrl: "/financeiro",
    children: [
      { title: "Visão Geral", url: "/financeiro", icon: Landmark, description: "Resumo financeiro geral" },
      { title: "Contas a Receber", url: "/financeiro/contas-a-receber", icon: TrendingUp, description: "Títulos e receitas a receber" },
      { title: "Contas a Pagar", url: "/financeiro/contas-a-pagar", icon: CreditCard, description: "Despesas e contas a pagar" },
      { title: "Lançamentos", url: "/financeiro/lancamentos", icon: BookOpen, description: "Lançamentos financeiros avulsos" },
      { title: "Plano de Contas", url: "/financeiro/plano-de-contas", icon: FolderTree, description: "Estrutura de contas contábeis" },
      { title: "Conciliação", url: "/financeiro/conciliacao-bancaria", icon: ArrowLeftRight, description: "Conciliação bancária automática" },
      { title: "Relatórios", url: "/financeiro/relatorios", icon: BarChart2, description: "DRE, fluxo de caixa e análises" },
      { title: "Configurações", url: "/financeiro/configuracoes", icon: SlidersHorizontal, description: "Regras de cobrança e métodos" },
    ],
  },
  {
    id: "operacional",
    title: "Suporte e Operacional",
    icon: Headphones,
    directUrl: "/suporte",
    children: [
      { title: "Suporte", url: "/suporte", icon: Headphones, description: "Chamados e SLA de atendimento" },
      { title: "Tarefas", url: "/tarefas", icon: ListTodo, description: "Gestão de tarefas e atividades" },
      { title: "Implantação", url: "/implantacao", icon: Rocket, description: "Projetos de implantação" },
      { title: "Técnicos", url: "/tecnicos", icon: Wrench, description: "Equipe técnica e responsáveis" },
    ],
  },
  {
    id: "cartoes",
    title: "Cartões",
    icon: CreditCard,
    directUrl: "/cartoes",
    children: [
      { title: "Dashboard", url: "/cartoes", icon: BarChart3, description: "Visão geral de maquininhas" },
      { title: "Clientes", url: "/cartoes/clientes", icon: Users, description: "Clientes de maquininha" },
      { title: "Propostas", url: "/cartoes/propostas", icon: FileText, description: "Propostas de maquininha" },
      { title: "Faturamento", url: "/cartoes/faturamento", icon: DollarSign, description: "Receita e comissões" },
    ],
  },
  {
    id: "configuracoes",
    title: "Configurações",
    icon: Settings,
    directUrl: "/configuracoes",
    children: [
      { title: "Minha Empresa", url: "/configuracoes", icon: Settings, description: "Dados e identidade da empresa" },
      { title: "Usuários", url: "/usuarios", icon: Shield, description: "Permissões e acessos" },
    ],
  },
];

/** Find the parent module and child for a given pathname */
export function findBreadcrumb(pathname: string): { parent: ParentModule; child: SubModule } | null {
  for (const mod of modules) {
    // Exact match first
    const exact = mod.children.find((c) => c.url === pathname);
    if (exact) return { parent: mod, child: exact };
  }
  // Prefix match for sub-routes like /propostas/:id
  for (const mod of modules) {
    for (const child of mod.children) {
      if (child.url !== "/" && pathname.startsWith(child.url)) {
        return { parent: mod, child };
      }
    }
  }
  return null;
}
