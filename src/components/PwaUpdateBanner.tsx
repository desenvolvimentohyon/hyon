import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PwaUpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export function PwaUpdateBanner({ onUpdate, onDismiss }: PwaUpdateBannerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg max-w-sm">
        <RefreshCw className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm text-foreground">
          Nova versão disponível
        </p>
        <Button size="sm" variant="default" className="h-7 px-3 text-xs rounded-lg" onClick={onUpdate}>
          Atualizar
        </Button>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
