import { cn } from "@/lib/utils";
import { Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClienteCardProps {
  nome: string;
  nomeFantasia?: string;
  documento?: string;
  telefone?: string;
  sistema?: string;
  systemColor?: string;
  statusBadge?: React.ReactNode;
  extraInfo?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  checkbox?: React.ReactNode;
}

export function ClienteCard({
  nome, nomeFantasia, documento, telefone, sistema, systemColor,
  statusBadge, extraInfo, actions, onClick, selected, checkbox,
}: ClienteCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-150 cursor-pointer",
        "hover:shadow-md hover:bg-accent/30",
        selected && "ring-2 ring-primary/40 bg-accent/20"
      )}
      style={{ borderLeft: `4px solid ${systemColor || "hsl(var(--border))"}` }}
    >
      {checkbox && <div onClick={e => e.stopPropagation()}>{checkbox}</div>}

      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
        "bg-muted/60"
      )}>
        <Monitor className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm uppercase truncate">{nome}</span>
          {statusBadge}
        </div>
        {nomeFantasia && nomeFantasia !== nome && (
          <p className="text-xs text-muted-foreground truncate">{nomeFantasia}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {documento && <span>{documento}</span>}
          {telefone && <span>{telefone}</span>}
          {sistema && (
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: systemColor, color: systemColor }}>
              {sistema}
            </Badge>
          )}
          {extraInfo}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        {actions}
      </div>
    </div>
  );
}
