import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Star, ChevronDown, User } from "lucide-react";
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
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FAVORITES_KEY = "sidebar-favorites";
const MAX_FAVORITES = 8;

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

  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Filter modules by search
  const lowerSearch = search.toLowerCase().trim();
  const filteredModules = useMemo(() => {
    if (!lowerSearch) return modules;
    return modules
      .map((mod) => {
        const parentMatch = mod.title.toLowerCase().includes(lowerSearch);
        const matchedChildren = mod.children.filter((c) =>
          c.title.toLowerCase().includes(lowerSearch)
        );
        if (parentMatch) return mod;
        if (matchedChildren.length > 0) return { ...mod, children: matchedChildren };
        return null;
      })
      .filter(Boolean) as typeof modules;
  }, [lowerSearch]);

  // Auto-expand all when searching
  useEffect(() => {
    if (lowerSearch) {
      setOpenModules(new Set(filteredModules.map((m) => m.id)));
    }
  }, [lowerSearch, filteredModules]);

  // Favorite items resolved
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
              className="h-8 pl-8 text-xs bg-sidebar-accent/40 border-sidebar-border/30 rounded-md placeholder:text-sidebar-foreground/30 focus-visible:ring-1 focus-visible:ring-sidebar-primary/30"
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
                  return (
                    <SidebarMenuItem key={`fav-${item.url}`}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink
                          to={item.url}
                          end={item.url === "/" || item.url === "/financeiro"}
                          className={cn(
                            "relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-150 text-[12px] mx-1",
                            active
                              ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                              : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                          )}
                          activeClassName=""
                        >
                          <item.icon className={cn("h-3.5 w-3.5 shrink-0", active && "text-sidebar-primary")} />
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
              {filteredModules.map((mod) => {
                const visibleChildren = mod.children.filter((c) => canAccess(c.url));
                if (visibleChildren.length === 0) return null;

                const isOpen = openModules.has(mod.id);
                const isParentActive = activeParentId === mod.id;

                if (collapsed) {
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

                return (
                  <div key={mod.id} className="mb-1">
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

                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-200",
                        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="ml-4 pl-3 border-l border-sidebar-border/30 mt-1 mb-1.5 space-y-0.5">
                        {visibleChildren.map((child) => {
                          const childActive = isActive(child.url);
                          const isFav = favorites.includes(child.url);
                          return (
                            <SidebarMenuItem key={child.url}>
                              <SidebarMenuButton asChild isActive={childActive}>
                                <div className="flex items-center group/fav">
                                  <NavLink
                                    to={child.url}
                                    end={child.url === "/" || child.url === "/financeiro"}
                                    className={cn(
                                      "relative flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-150 text-[12.5px] flex-1",
                                      childActive
                                        ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                                    )}
                                    activeClassName=""
                                  >
                                    <child.icon className={cn("h-3.5 w-3.5 shrink-0", childActive && "text-sidebar-primary")} />
                                    <span>{child.title}</span>
                                  </NavLink>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(child.url);
                                    }}
                                    className={cn(
                                      "p-1 rounded transition-all duration-150 shrink-0",
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 pt-2">
        <Separator className="mb-2 bg-sidebar-border/30" />
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-1">
              <div className="h-8 w-8 rounded-full bg-sidebar-primary/15 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-sidebar-primary">
                  {(currentUser?.nome || profile?.full_name || "U").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
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
              <p className="text-[9px] text-sidebar-foreground/20 font-mono">© 2025 Hyon Tech · v1.0</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-full bg-sidebar-primary/15 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-sidebar-primary">
                {(currentUser?.nome || profile?.full_name || "U").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
              </span>
            </div>
            <p className="text-[8px] text-sidebar-foreground/15 font-mono">v1</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
