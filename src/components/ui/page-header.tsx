import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between pb-4 mb-1 border-b border-border/50", className)}>
      <div>
        <h1 className="text-[28px] lg:text-[32px] font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
