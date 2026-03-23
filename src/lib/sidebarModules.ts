import {
  LayoutDashboard, Users, TrendingUp, Headphones, BarChart3, FileText, Kanban,
  DollarSign, Landmark, CreditCard, FolderTree, ArrowLeftRight, BookOpen, BarChart2,
  SlidersHorizontal, Shield, Settings, Wrench, Rocket, Handshake, ShoppingCart,
  Receipt, ListTodo
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
      { title: "Painel Executivo", url: "/executivo", icon: BarChart3, description: "Métricas estratégicas e KPIs" },
    ],
  },
  {
    id: "clientes",
    title: "Clientes",
    icon: Users,
    children: [
      { title: "Cadastro de Clientes", url: "/clientes", icon: Users },
      { title: "Receita / MRR", url: "/receita", icon: DollarSign },
      { title: "Checkout Interno", url: "/checkout-interno", icon: ShoppingCart },
    ],
  },
  {
    id: "comercial",
    title: "Comercial",
    icon: TrendingUp,
    children: [
      { title: "Propostas", url: "/propostas", icon: FileText },
      { title: "CRM", url: "/crm", icon: Kanban },
      { title: "Painel Comercial", url: "/comercial", icon: TrendingUp },
      { title: "Parceiros", url: "/parceiros", icon: Handshake },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    icon: Landmark,
    children: [
      { title: "Visão Geral", url: "/financeiro", icon: Landmark },
      { title: "Contas a Receber", url: "/financeiro/contas-a-receber", icon: TrendingUp },
      { title: "Contas a Pagar", url: "/financeiro/contas-a-pagar", icon: CreditCard },
      { title: "Lançamentos", url: "/financeiro/lancamentos", icon: BookOpen },
      { title: "Plano de Contas", url: "/financeiro/plano-de-contas", icon: FolderTree },
      { title: "Conciliação", url: "/financeiro/conciliacao-bancaria", icon: ArrowLeftRight },
      { title: "Relatórios", url: "/financeiro/relatorios", icon: BarChart2 },
      { title: "Configurações", url: "/financeiro/configuracoes", icon: SlidersHorizontal },
    ],
  },
  {
    id: "operacional",
    title: "Suporte e Operacional",
    icon: Headphones,
    children: [
      { title: "Suporte", url: "/suporte", icon: Headphones },
      { title: "Tarefas", url: "/tarefas", icon: ListTodo },
      { title: "Implantação", url: "/implantacao", icon: Rocket },
      { title: "Técnicos", url: "/tecnicos", icon: Wrench },
    ],
  },
  {
    id: "cartoes",
    title: "Cartões",
    icon: CreditCard,
    children: [
      { title: "Dashboard", url: "/cartoes", icon: BarChart3 },
      { title: "Clientes", url: "/cartoes/clientes", icon: Users },
      { title: "Propostas", url: "/cartoes/propostas", icon: FileText },
      { title: "Faturamento", url: "/cartoes/faturamento", icon: DollarSign },
    ],
  },
  {
    id: "configuracoes",
    title: "Configurações",
    icon: Settings,
    children: [
      { title: "Minha Empresa", url: "/configuracoes", icon: Settings },
      { title: "Usuários", url: "/usuarios", icon: Shield },
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
