import { useLocation, useNavigate } from "react-router-dom";
import { modules } from "@/lib/sidebarModules";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSmartCardStats } from "@/hooks/useSmartCardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const MODULE_COLORS: Record<string, { color: string; bg: string; border: string; stroke: string }> = {
  dashboard: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", stroke: "hsl(var(--primary))" },
  clientes: { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", stroke: "#10b981" },
  comercial: { color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/30", stroke: "#6366f1" },
  financeiro: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", stroke: "#22c55e" },
  operacional: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", stroke: "#f97316" },
  cartoes: { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", stroke: "#a855f7" },
  configuracoes: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", stroke: "hsl(var(--primary))" },
};

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  down: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
  neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted/50" },
};

interface ModuleNavGridProps {
  moduleId: string;
}

export function ModuleNavGrid({ moduleId }: ModuleNavGridProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const mod = modules.find((m) => m.id === moduleId);
  const { stats, isLoading } = useSmartCardStats();

  if (!mod || mod.children.length <= 1) return null;

  const palette = MODULE_COLORS[moduleId] || MODULE_COLORS.dashboard;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {mod.children.map((child, i) => {
          const isActive = location.pathname === child.url;
          const Icon = child.icon;
          const cardStats = stats[child.url];

          return (
            <Tooltip key={child.url}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(child.url)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 animate-fade-in min-h-[120px]",
                    "hover:shadow-md hover:scale-[1.02]",
                    isActive
                      ? cn("border-l-4 shadow-md", palette.border, palette.bg)
                      : "border-border/60 bg-card hover:border-border"
                  )}
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isActive ? palette.bg : "bg-muted/50"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? palette.color : "text-muted-foreground")} />
                    </div>
                    <p className={cn("text-sm font-semibold leading-tight truncate", isActive ? "text-foreground" : "text-foreground/80")}>
                      {child.title}
                    </p>
                  </div>

                  {/* Stats area */}
                  {isLoading && cardStats === undefined ? (
                    <div className="flex flex-col gap-1 w-full mt-auto">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ) : cardStats ? (
                    <div className="flex flex-col gap-1 w-full mt-auto">
                      <div className="flex items-end gap-2">
                        <span className={cn("text-lg font-bold leading-none", palette.color)}>
                          {cardStats.mainValue}
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-none mb-[1px]">
                          {cardStats.mainLabel}
                        </span>
                      </div>
                      {(cardStats.secondaryValue || cardStats.trend) && (
                        <div className="flex items-center gap-1.5">
                          {cardStats.trend && cardStats.trend !== "neutral" && (() => {
                            const cfg = TREND_CONFIG[cardStats.trend];
                            const TrendIcon = cfg.icon;
                            return (
                              <span className={cn("flex items-center gap-0.5 text-[11px] font-medium rounded-full px-1.5 py-0.5", cfg.bg, cfg.color)}>
                                <TrendIcon className="h-3 w-3" />
                              </span>
                            );
                          })()}
                          {cardStats.secondaryValue && (
                            <span className="text-[11px] text-muted-foreground">
                              {cardStats.secondaryValue} {cardStats.secondaryLabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    child.description && (
                      <p className="text-[11px] text-muted-foreground mt-auto leading-snug">{child.description}</p>
                    )
                  )}

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
