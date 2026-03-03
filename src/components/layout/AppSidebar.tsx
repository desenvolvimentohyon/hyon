import { LayoutDashboard, ListTodo, Users, Wrench, Settings, TrendingUp, Rocket, Headphones, BarChart3, FileText, Kanban, DollarSign, Landmark, Receipt, CreditCard, FolderTree, ArrowLeftRight, BookOpen, BarChart2, SlidersHorizontal, Shield, Settings2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUsers } from "@/contexts/UsersContext";
import { ROTA_PERMISSAO } from "@/types/users";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const sections = [
  {
    label: "Operacional",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Tarefas", url: "/tarefas", icon: ListTodo },
    ],
  },
  {
    label: "Módulos",
    items: [
      { title: "Comercial", url: "/comercial", icon: TrendingUp },
      { title: "Implantação", url: "/implantacao", icon: Rocket },
      { title: "Suporte", url: "/suporte", icon: Headphones },
      { title: "Propostas", url: "/propostas", icon: FileText },
      { title: "CRM", url: "/crm", icon: Kanban },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Visão Geral", url: "/financeiro", icon: Landmark },
      { title: "Contas a Receber", url: "/financeiro/contas-a-receber", icon: TrendingUp },
      { title: "Contas a Pagar", url: "/financeiro/contas-a-pagar", icon: CreditCard },
      { title: "Lançamentos", url: "/financeiro/lancamentos", icon: BookOpen },
      { title: "Plano de Contas", url: "/financeiro/plano-de-contas", icon: FolderTree },
      { title: "Conciliação", url: "/financeiro/conciliacao-bancaria", icon: ArrowLeftRight },
      { title: "Relatórios", url: "/financeiro/relatorios", icon: BarChart2 },
      { title: "Config. Financeira", url: "/financeiro/configuracoes", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Receita", url: "/receita", icon: DollarSign },
      { title: "Técnicos", url: "/tecnicos", icon: Wrench },
      { title: "Painel Executivo", url: "/executivo", icon: BarChart3 },
      { title: "Usuários", url: "/usuarios", icon: Shield },
      { title: "Parâmetros", url: "/parametros", icon: Settings2 },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { hasPermission } = useUsers();

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    if (path === "/financeiro") return currentPath === "/financeiro";
    return currentPath.startsWith(path);
  };

  const canAccess = (url: string) => {
    const perm = ROTA_PERMISSAO[url];
    if (!perm) return true; // no restriction defined
    return hasPermission(perm);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            GT
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">GestãoTask</span>
              <span className="text-[10px] text-sidebar-foreground/50">Revenda ERP</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => {
          const visibleItems = section.items.filter(item => canAccess(item.url));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                        <NavLink to={item.url} end={item.url === "/" || item.url === "/financeiro"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/40 text-center">v4.0 — RBAC + Financeiro</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
