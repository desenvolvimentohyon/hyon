import { useLocation, useNavigate } from "react-router-dom";
import { modules } from "@/lib/sidebarModules";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MODULE_COLORS: Record<string, { color: string; inactiveColor: string; bg: string; border: string; activeBg: string; glow: string }> = {
  dashboard:     { color: "text-primary",     inactiveColor: "text-primary/50",     bg: "bg-primary/10",     border: "border-primary/40",     activeBg: "bg-primary/15",     glow: "0 0 14px hsla(var(--primary),.35)" },
  clientes:      { color: "text-emerald-500", inactiveColor: "text-emerald-500/50", bg: "bg-emerald-500/10", border: "border-emerald-500/40", activeBg: "bg-emerald-500/15", glow: "0 0 14px rgba(16,185,129,.35)" },
  comercial:     { color: "text-indigo-500",  inactiveColor: "text-indigo-500/50",  bg: "bg-indigo-500/10",  border: "border-indigo-500/40",  activeBg: "bg-indigo-500/15",  glow: "0 0 14px rgba(99,102,241,.35)" },
  financeiro:    { color: "text-green-500",   inactiveColor: "text-green-500/50",   bg: "bg-green-500/10",   border: "border-green-500/40",   activeBg: "bg-green-500/15",   glow: "0 0 14px rgba(34,197,94,.35)" },
  operacional:   { color: "text-orange-500",  inactiveColor: "text-orange-500/50",  bg: "bg-orange-500/10",  border: "border-orange-500/40",  activeBg: "bg-orange-500/15",  glow: "0 0 14px rgba(249,115,22,.35)" },
  cartoes:       { color: "text-purple-500",  inactiveColor: "text-purple-500/50",  bg: "bg-purple-500/10",  border: "border-purple-500/40",  activeBg: "bg-purple-500/15",  glow: "0 0 14px rgba(168,85,247,.35)" },
  configuracoes: { color: "text-primary",     inactiveColor: "text-primary/50",     bg: "bg-primary/10",     border: "border-primary/40",     activeBg: "bg-primary/15",     glow: "0 0 14px hsla(var(--primary),.35)" },
};

function isModuleActive(moduleId: string, pathname: string): boolean {
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) return false;
  return mod.children.some((c) => {
    if (c.url === "/") return pathname === "/";
    return pathname === c.url || pathname.startsWith(c.url + "/");
  });
}

export function ModuleNavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        className="sticky top-16 z-10 flex items-center justify-center gap-1 sm:gap-3 md:gap-5 px-2 sm:px-4 py-2 bg-background/80 backdrop-blur-md overflow-x-auto scrollbar-none"
        style={{ borderBottom: "1px solid hsl(var(--border) / 0.4)" }}
      >
        {modules.map((mod) => {
          const active = isModuleActive(mod.id, location.pathname);
          const palette = MODULE_COLORS[mod.id] || MODULE_COLORS.dashboard;
          const Icon = mod.icon;

          return (
            <Tooltip key={mod.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(mod.directUrl || mod.children[0]?.url || "/")}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 min-w-[72px] group",
                    "hover:scale-105",
                    active
                      ? cn("border", palette.border, palette.activeBg, "shadow-sm")
                      : "border border-transparent hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300",
                      active
                        ? cn(palette.bg, palette.border, palette.color)
                        : cn("bg-muted/50 border-border/40", palette.inactiveColor, "group-hover:border-border", `group-hover:${palette.color}`)
                    )}
                    style={active ? { boxShadow: palette.glow } : undefined}
                  >
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium leading-tight text-center truncate max-w-[80px] transition-colors duration-300",
                      active ? palette.color : cn(palette.inactiveColor, "group-hover:" + palette.color.replace("text-", "text-"))
                    )}
                  >
                    {mod.title}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {mod.title}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
