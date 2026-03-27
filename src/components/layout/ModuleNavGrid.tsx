import { useLocation, useNavigate } from "react-router-dom";
import { modules } from "@/lib/sidebarModules";
import { cn } from "@/lib/utils";

const MODULE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  dashboard: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/40" },
  clientes: { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/40" },
  comercial: { color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/40" },
  financeiro: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/40" },
  operacional: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/40" },
  cartoes: { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/40" },
  configuracoes: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/40" },
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
    <div className="flex items-center gap-1 border-b border-border/40 pb-3 mb-4 overflow-x-auto scrollbar-none">
      {mod.children.map((child) => {
        const isActive = location.pathname === child.url;
        const Icon = child.icon;

        return (
          <button
            key={child.url}
            onClick={() => navigate(child.url)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
              isActive
                ? cn(palette.bg, palette.color, "border", palette.border)
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive ? palette.color : "text-muted-foreground")} />
            {child.title}
          </button>
        );
      })}
    </div>
  );
}
