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
    <div className={cn("flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 mb-1 border-b border-border/60", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/70 border border-border/60 flex items-center justify-center shadow-sm">
            <Icon className={cn("h-5 w-5", iconClassName || "text-primary")} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-[12px] sm:text-[13px] mt-1 tracking-tight truncate sm:whitespace-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full lg:w-auto lg:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

