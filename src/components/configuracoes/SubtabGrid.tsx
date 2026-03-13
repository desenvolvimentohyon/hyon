import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SubtabItem {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string; // e.g. "text-primary", "text-purple-500"
  bgClass: string;    // e.g. "bg-primary/10", "bg-purple-500/10"
  borderClass: string; // e.g. "border-primary/30"
}

interface SubtabGridProps {
  items: SubtabItem[];
  value: string;
  onChange: (value: string) => void;
}

export function SubtabGrid({ items, value, onChange }: SubtabGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {items.map((item) => {
        const isActive = value === item.value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200",
              "hover:shadow-md hover:scale-[1.02]",
              isActive
                ? cn("border-l-4 shadow-md", item.borderClass, item.bgClass)
                : "border-border/60 bg-card hover:border-border"
            )}
          >
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isActive ? item.bgClass : "bg-muted/50"
            )}>
              <Icon className={cn("h-4.5 w-4.5", isActive ? item.colorClass : "text-muted-foreground")} />
            </div>
            <div>
              <p className={cn(
                "text-sm font-semibold leading-tight",
                isActive ? "text-foreground" : "text-foreground/80"
              )}>
                {item.label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {item.description}
              </p>
            </div>
            {isActive && (
              <div className={cn("absolute top-2 right-2 h-2 w-2 rounded-full", item.colorClass.replace("text-", "bg-"))} />
            )}
          </button>
        );
      })}
    </div>
  );
}
