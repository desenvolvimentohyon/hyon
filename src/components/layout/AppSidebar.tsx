import { useState, useMemo, useCallback } from "react";
import { Search, Star } from "lucide-react";
import logoHyon from "@/assets/logo-hyon.png";
import logoHyonVertical from "@/assets/logo-hyon-vertical.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUsers } from "@/contexts/UsersContext";
import { useAuth } from "@/contexts/AuthContext";
import { ROTA_PERMISSAO } from "@/types/users";
import { modules } from "@/lib/sidebarModules";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
      mod.title.toLowerCase().includes(lowerSearch)
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

  // Find parent module for a child URL (for color mapping)
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
                            "relative flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200 text-[12px] mx-1",
                            active
                              ? cn(palette.active, palette.glow, "font-medium")
                              : "border-transparent text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 hover:border-sidebar-border/30"
                          )}
                          activeClassName=""
                        >
                          <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors",
                            active ? palette.active.split(" ")[0] : "bg-sidebar-accent/30"
                          )}>
                            <item.icon className={cn("h-3 w-3", active ? palette.icon : "text-sidebar-foreground/50")} />
                          </div>
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

        {/* Module groups */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={300}>
                {filteredModules.map((mod) => {
                  const visibleChildren = mod.children.filter((c) => canAccess(c.url));
                  if (visibleChildren.length === 0) return null;

                  const isOpen = openModules.has(mod.id);
                  const isParentActive = activeParentId === mod.id;
                  const palette = MODULE_SIDEBAR_COLORS[mod.id] || MODULE_SIDEBAR_COLORS.dashboard;

                  if (collapsed) {
                    const targetUrl = mod.directUrl || visibleChildren[0].url;
                    return (
                      <SidebarMenuItem key={mod.id}>
                        <SidebarMenuButton asChild isActive={isParentActive} tooltip={mod.title}>
                          <NavLink
                            to={targetUrl}
                            end={targetUrl === "/"}
                            className={cn(
                              "relative flex items-center justify-center transition-all duration-200 rounded-xl mx-1 border",
                              isParentActive
                                ? cn(palette.active, palette.glow, "font-semibold")
                                : "border-transparent text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:border-sidebar-border/30"
                            )}
                            activeClassName=""
                          >
                            <mod.icon className={cn("h-4 w-4", isParentActive ? palette.icon : "text-sidebar-foreground/60")} />
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <div key={mod.id} className="mb-0.5">
                      <SidebarMenuItem>
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className={cn(
                            "flex items-center w-full gap-2.5 px-3 py-2.5 rounded-xl mx-1 text-left transition-all duration-200 group border",
                            isParentActive
                              ? cn(palette.active, palette.glow, "font-semibold")
                              : "border-transparent text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:border-sidebar-border/30"
                          )}
                        >
                          <div className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                            isParentActive ? palette.active.split(" ")[0] : "bg-sidebar-accent/30"
                          )}>
                            <mod.icon className={cn("h-3.5 w-3.5", isParentActive ? palette.icon : "text-sidebar-foreground/50")} />
                          </div>
                          <span className="text-[13px] flex-1">{mod.title}</span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>
                      </SidebarMenuItem>

                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-200",
                          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="ml-3 pl-3 border-l border-sidebar-border/20 mt-1 mb-1.5 space-y-0.5">
                          {visibleChildren.map((child) => {
                            const childActive = isActive(child.url);
                            const isFav = favorites.includes(child.url);
                            return (
                              <SidebarMenuItem key={child.url}>
                                <SidebarMenuButton asChild isActive={childActive}>
                                  <div className="flex items-center group/fav">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <NavLink
                                          to={child.url}
                                          end={child.url === "/" || child.url === "/financeiro"}
                                          className={cn(
                                            "relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all duration-200 text-[12.5px] flex-1",
                                            childActive
                                              ? cn(palette.active, palette.glow, "font-medium")
                                              : "border-transparent text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 hover:border-sidebar-border/20"
                                          )}
                                          activeClassName=""
                                        >
                                          <div className={cn(
                                            "flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md transition-colors",
                                            childActive ? palette.active.split(" ")[0] : "bg-transparent"
                                          )}>
                                            <child.icon className={cn("h-3.5 w-3.5", childActive ? palette.icon : "text-sidebar-foreground/45")} />
                                          </div>
                                          <span>{child.title}</span>
                                        </NavLink>
                                      </TooltipTrigger>
                                      {child.description && (
                                        <TooltipContent side="right" className="max-w-[200px]">
                                          <p className="text-xs">{child.description}</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(child.url);
                                      }}
                                      className={cn(
                                        "p-1 rounded-lg transition-all duration-200 shrink-0",
                                        isFav
                                          ? "text-amber-500 opacity-100"
                                          : "text-sidebar-foreground/20 opacity-0 group-hover/fav:opacity-100 hover:text-amber-500"
                                      )}
                                      title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                    >
                                      <Star className={cn("h-3 w-3", isFav && "fill-amber-500")} />
                                    </button>
                                  </div>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
              <p className="text-[9px] text-sidebar-foreground/20 font-mono">© 2026 Hyon Tecnologia · v1.0</p>
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
