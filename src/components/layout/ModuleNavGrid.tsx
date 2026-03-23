import { useLocation, useNavigate } from "react-router-dom";
import { modules } from "@/lib/sidebarModules";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MODULE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  dashboard: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
  clientes: { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  comercial: { color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
  financeiro: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
  operacional: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  cartoes: { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  configuracoes: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
};

interface ModuleNavGridProps {
  moduleId: string;
}

export function ModuleNavGrid({ moduleId }: ModuleNavGridProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod || mod.children.length <= 1) return null;

  const palette = MODULE_COLORS[moduleId] || MODULE_COLORS.dashboard;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {mod.children.map((child, i) => {
          const isActive = location.pathname === child.url;
          const Icon = child.icon;
          return (
            <Tooltip key={child.url}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(child.url)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 animate-fade-in",
                    "hover:shadow-md hover:scale-[1.02]",
                    isActive
                      ? cn("border-l-4 shadow-md", palette.border, palette.bg)
                      : "border-border/60 bg-card hover:border-border"
                  )}
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      isActive ? palette.bg : "bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5", isActive ? palette.color : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold leading-tight", isActive ? "text-foreground" : "text-foreground/80")}>
                      {child.title}
                    </p>
                    {child.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{child.description}</p>
                    )}
                  </div>
                  {isActive && (
                    <div className={cn("absolute top-2 right-2 h-2 w-2 rounded-full", palette.color.replace("text-", "bg-"))} />
                  )}
                </button>
              </TooltipTrigger>
              {child.description && (
                <TooltipContent side="bottom">
                  <p>{child.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
