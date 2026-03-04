import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, TrendingUp, Headphones, BarChart3, FileText, Kanban,
  DollarSign, Landmark, CreditCard, FolderTree, ArrowLeftRight, BookOpen, BarChart2,
  SlidersHorizontal, Shield, Settings, Wrench, Rocket, Handshake, ShoppingCart,
  ChevronDown, Receipt, GraduationCap, FileBarChart, Settings2, ListTodo
} from "lucide-react";
import logoHyon from "@/assets/logo-hyon.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUsers } from "@/contexts/UsersContext";
import { ROTA_PERMISSAO } from "@/types/users";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SubModule {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface ParentModule {
  id: string;
  title: string;
  icon: React.ElementType;
  children: SubModule[];
  /** If set, clicking the parent navigates here directly (no children shown) */
  directUrl?: string;
}

const modules: ParentModule[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    directUrl: "/",
    children: [
      { title: "Visão Geral", url: "/", icon: LayoutDashboard },
      { title: "Painel Executivo", url: "/executivo", icon: BarChart3 },
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
      { title: "Comercial", url: "/comercial", icon: TrendingUp },
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
    title: "Operacional",
    icon: ListTodo,
    children: [
      { title: "Tarefas", url: "/tarefas", icon: ListTodo },
      { title: "Implantação", url: "/implantacao", icon: Rocket },
      { title: "Técnicos", url: "/tecnicos", icon: Wrench },
    ],
  },
  {
    id: "suporte",
    title: "Suporte",
    icon: Headphones,
    children: [
      { title: "Suporte", url: "/suporte", icon: Headphones },
    ],
  },
  {
    id: "configuracoes",
    title: "Configurações",
    icon: Settings,
    children: [
      { title: "Minha Empresa", url: "/configuracoes", icon: Settings },
      { title: "Usuários", url: "/usuarios", icon: Shield },
      { title: "Parâmetros", url: "/parametros", icon: Settings2 },
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
    if (!perm) return true;
    return hasPermission(perm);
  };

  // Determine which parent module contains the active route
  const activeParentId = modules.find((m) =>
    m.children.some((c) => isActive(c.url))
  )?.id;

  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  // Auto-expand the module containing the active route
  useEffect(() => {
    if (activeParentId) {
      setOpenModules((prev) => {
        if (prev.has(activeParentId)) return prev;
        const next = new Set(prev);
        next.add(activeParentId);
        return next;
      });
    }
  }, [activeParentId]);

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <img
            src={logoHyon}
            alt="Hyon Tech"
            className={`${collapsed ? "h-8 w-8 object-contain" : "h-10 w-auto"} transition-all`}
          />
        </div>
      </SidebarHeader>

      {!collapsed && <Separator className="mx-4 w-auto bg-sidebar-border/50" />}

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((mod) => {
                const visibleChildren = mod.children.filter((c) => canAccess(c.url));
                if (visibleChildren.length === 0) return null;

                const isOpen = openModules.has(mod.id);
                const isParentActive = activeParentId === mod.id;

                // In collapsed mode, show only icons with tooltip
                if (collapsed) {
                  // If single child or directUrl, link directly
                  const targetUrl = mod.directUrl || visibleChildren[0].url;
                  return (
                    <SidebarMenuItem key={mod.id}>
                      <SidebarMenuButton asChild isActive={isParentActive} tooltip={mod.title}>
                        <NavLink
                          to={targetUrl}
                          end={targetUrl === "/"}
                          className={cn(
                            "relative transition-all duration-150 rounded-lg mx-1",
                            isParentActive
                              ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                          )}
                          style={isParentActive ? { boxShadow: "-2px 0 10px hsl(221 83% 58% / 0.2)" } : undefined}
                          activeClassName=""
                        >
                          {isParentActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary shadow-[0_0_6px_hsl(221_83%_58%/0.5)]" />
                          )}
                          <mod.icon className={cn("h-4 w-4", isParentActive && "text-sidebar-primary")} />
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Expanded sidebar: show parent + collapsible children
                return (
                  <div key={mod.id} className="mb-0.5">
                    {/* Parent module button */}
                    <SidebarMenuItem>
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className={cn(
                          "flex items-center w-full gap-2 px-3 py-2 rounded-lg mx-1 text-left transition-all duration-150 group",
                          isParentActive
                            ? "bg-sidebar-primary/10 text-sidebar-primary font-semibold"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        )}
                        style={isParentActive ? { boxShadow: "-2px 0 10px hsl(221 83% 58% / 0.15)" } : undefined}
                      >
                        {isParentActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary shadow-[0_0_6px_hsl(221_83%_58%/0.5)]" />
                        )}
                        <mod.icon className={cn("h-4 w-4 shrink-0", isParentActive && "text-sidebar-primary")} />
                        <span className="text-[13px] flex-1">{mod.title}</span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>
                    </SidebarMenuItem>

                    {/* Children - animated collapse */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-200",
                        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="ml-4 pl-3 border-l border-sidebar-border/30 mt-0.5 mb-1 space-y-0.5">
                        {visibleChildren.map((child) => {
                          const childActive = isActive(child.url);
                          return (
                            <SidebarMenuItem key={child.url}>
                              <SidebarMenuButton asChild isActive={childActive}>
                                <NavLink
                                  to={child.url}
                                  end={child.url === "/" || child.url === "/financeiro"}
                                  className={cn(
                                    "relative flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-150 text-[12.5px]",
                                    childActive
                                      ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                                  )}
                                  activeClassName=""
                                >
                                  <child.icon className={cn("h-3.5 w-3.5 shrink-0", childActive && "text-sidebar-primary")} />
                                  <span>{child.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/25 text-center font-medium">© 2025 Hyon Tech</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
