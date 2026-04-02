import { useState, useMemo, useCallback } from "react";
import { Search, Star, ChevronRight } from "lucide-react";
import logoHyon from "@/assets/logo-hyon.png";
import logoHyonVertical from "@/assets/logo-hyon-vertical.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUsers } from "@/contexts/UsersContext";
import { useAuth } from "@/contexts/AuthContext";
import { ROTA_PERMISSAO } from "@/types/users";
import { modules } from "@/lib/sidebarModules";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FAVORITES_KEY = "sidebar-favorites";
const MAX_FAVORITES = 8;

const MODULE_SIDEBAR_COLORS: Record<string, { active: string; icon: string; glow: string }> = {
  dashboard: { active: "bg-primary/12 border-primary/30", icon: "text-primary", glow: "shadow-[0_0_8px_hsl(var(--primary)/0.15)]" },
  clientes: { active: "bg-emerald-500/12 border-emerald-500/30", icon: "text-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.15)]" },
  comercial: { active: "bg-indigo-500/12 border-indigo-500/30", icon: "text-indigo-500", glow: "shadow-[0_0_8px_rgba(99,102,241,0.15)]" },
  financeiro: { active: "bg-green-500/12 border-green-500/30", icon: "text-green-500", glow: "shadow-[0_0_8px_rgba(34,197,94,0.15)]" },
  operacional: { active: "bg-orange-500/12 border-orange-500/30", icon: "text-orange-500", glow: "shadow-[0_0_8px_rgba(249,115,22,0.15)]" },
  cartoes: { active: "bg-purple-500/12 border-purple-500/30", icon: "text-purple-500", glow: "shadow-[0_0_8px_rgba(168,85,247,0.15)]" },
  configuracoes: { active: "bg-primary/12 border-primary/30", icon: "text-primary", glow: "shadow-[0_0_8px_hsl(var(--primary)/0.15)]" },
};

function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    } catch { return []; }
  });

  const toggle = useCallback((url: string) => {
    setFavorites((prev) => {
      const next = prev.includes(url)
        ? prev.filter((u) => u !== url)
        : prev.length < MAX_FAVORITES ? [...prev, url] : prev;
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, toggle };
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { hasPermission, getCurrentUser } = useUsers();
  const { profile } = useAuth();
  const { favorites, toggle: toggleFavorite } = useFavorites();
  const currentUser = getCurrentUser();
  const [search, setSearch] = useState("");

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

  const activeParentId = modules.find((m) =>
    m.children.some((c) => isActive(c.url))
  )?.id;

  const lowerSearch = search.toLowerCase().trim();
  const filteredModules = useMemo(() => {
    if (!lowerSearch) return modules;
    return modules.filter((mod) =>
      mod.title.toLowerCase().includes(lowerSearch) ||
      mod.children.some(c => c.title.toLowerCase().includes(lowerSearch))
    );
  }, [lowerSearch]);

  const favoriteItems = useMemo(() => {
    const items: { title: string; url: string; icon: React.ElementType }[] = [];
    for (const fav of favorites) {
      for (const mod of modules) {
        const child = mod.children.find((c) => c.url === fav);
        if (child && canAccess(child.url)) {
          items.push(child);
          break;
        }
      }
    }
    return items;
  }, [favorites]);

  const findParentId = (url: string) => {
    return modules.find((m) => m.children.some((c) => c.url === url))?.id || "dashboard";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center justify-center">
          {collapsed ? (
            <img src={logoHyon} alt="Hyon" className="h-10 w-10 object-contain" />
          ) : (
            <img src={logoHyonVertical} alt="Hyon" className="h-20 w-auto object-contain" />
          )}
        </div>
      </SidebarHeader>

      {!collapsed && <Separator className="mx-4 w-auto bg-sidebar-border/50" />}

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40" />
            <Input
              placeholder="Buscar módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-sidebar-accent/40 border-sidebar-border/30 rounded-lg placeholder:text-sidebar-foreground/30 focus-visible:ring-1 focus-visible:ring-sidebar-primary/30"
            />
          </div>
        </div>
      )}

      <SidebarContent className="pt-1">
        {/* Favorites section */}
        {!collapsed && favoriteItems.length > 0 && !lowerSearch && (
          <SidebarGroup>
            <div className="px-3 pb-1 flex items-center gap-1.5">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">Favoritos</span>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {favoriteItems.map((item) => {
                  const active = isActive(item.url);
                  const parentId = findParentId(item.url);
                  const palette = MODULE_SIDEBAR_COLORS[parentId] || MODULE_SIDEBAR_COLORS.dashboard;
                  return (
                    <SidebarMenuItem key={`fav-${item.url}`}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink
                          to={item.url}
                          end={item.url === "/" || item.url === "/financeiro"}
                          className={cn(
                            "relative flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-200 text-[12px] mx-1",
                            active
                              ? cn(palette.active, palette.glow, "font-medium")
                              : "border-transparent text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                          )}
                          activeClassName=""
                        >
                          <item.icon className={cn("h-4 w-4", active ? palette.icon : "text-sidebar-foreground/50")} />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            <Separator className="mx-4 my-1.5 w-auto bg-sidebar-border/30" />
          </SidebarGroup>
        )}

        {/* Module groups — collapsible list */}
        {filteredModules.map((mod) => {
          const hasAccess = mod.children.some((c) => canAccess(c.url));
          if (!hasAccess) return null;
          const isParentActive = activeParentId === mod.id;
          const palette = MODULE_SIDEBAR_COLORS[mod.id] || MODULE_SIDEBAR_COLORS.dashboard;

          if (collapsed) {
            const targetUrl = mod.directUrl || mod.children[0].url;
            return (
              <SidebarGroup key={mod.id} className="p-1">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isParentActive} tooltip={mod.title}>
                      <NavLink
                        to={targetUrl}
                        end={targetUrl === "/"}
                        className={cn(
                          "flex items-center justify-center p-2 rounded-lg transition-all duration-200",
                          isParentActive
                            ? cn(palette.active, palette.glow)
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                        )}
                        activeClassName=""
                      >
                        <mod.icon className={cn("h-4 w-4", isParentActive ? palette.icon : "text-sidebar-foreground/50")} />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          }

          // Single child: no collapsible needed
          if (mod.children.length <= 1) {
            const child = mod.children[0];
            const active = isActive(child.url);
            return (
              <SidebarGroup key={mod.id} className="py-0.5">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={child.url}
                        end={child.url === "/" || child.url === "/financeiro"}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-[13px] mx-1",
                          active
                            ? cn(palette.active, palette.glow, "font-medium border", palette.active.split(" ")[1])
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                        )}
                        activeClassName=""
                      >
                        <mod.icon className={cn("h-4 w-4", active ? palette.icon : "text-sidebar-foreground/50")} />
                        <span>{mod.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          }

          return (
            <Collapsible key={mod.id} defaultOpen={isParentActive} className="group/collapsible">
              <SidebarGroup className="py-0.5">
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 text-[13px] font-semibold mx-1",
                    isParentActive
                      ? cn("text-sidebar-foreground", palette.icon)
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                  )}>
                    <mod.icon className={cn("h-4 w-4 shrink-0", isParentActive ? palette.icon : "text-sidebar-foreground/50")} />
                    <span className="flex-1 text-left">{mod.title}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/30 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="pl-4 mt-0.5">
                      {mod.children.map((child) => {
                        if (!canAccess(child.url)) return null;
                        const active = isActive(child.url);
                        return (
                          <SidebarMenuItem key={child.url}>
                            <SidebarMenuButton asChild isActive={active} size="sm">
                              <NavLink
                                to={child.url}
                                end={child.url === "/" || child.url === "/financeiro"}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-[12px] mx-1",
                                  active
                                    ? cn(palette.active, "font-medium border", palette.active.split(" ")[1])
                                    : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 border border-transparent"
                                )}
                                activeClassName=""
                              >
                                <child.icon className={cn("h-3.5 w-3.5", active ? palette.icon : "text-sidebar-foreground/40")} />
                                <span>{child.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 pt-2">
        <Separator className="mb-2 bg-sidebar-border/30" />
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl border border-sidebar-border/20 bg-sidebar-accent/20">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-primary">
                  {(currentUser?.nome || profile?.full_name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-sidebar-foreground/80 truncate">
                  {currentUser?.nome || profile?.full_name || "Usuário"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/40 capitalize truncate">
                  {profile?.role || "usuário"}
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-sidebar-foreground/20 font-mono">© 2026 Hyon Tecnologia · v{(() => { try { const d = new Date(__BUILD_TIMESTAMP__); const m = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][d.getMonth()]; return `${String(d.getDate()).padStart(2,'0')}${m} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; } catch { return '1.0'; } })()}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-primary">
                {(currentUser?.nome || profile?.full_name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </span>
            </div>
            <p className="text-[8px] text-sidebar-foreground/15 font-mono">v1</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
