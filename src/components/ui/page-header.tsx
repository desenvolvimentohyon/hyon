import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, iconClassName, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between pb-4 mb-1 border-b border-border/50", className)}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="h-9 w-9 rounded-lg bg-muted/80 flex items-center justify-center">
            <Icon className={cn("h-5 w-5", iconClassName || "text-primary")} />
          </div>
        )}
        <div>
          <h1 className="text-[28px] lg:text-[32px] font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
