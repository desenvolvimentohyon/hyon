import { useEffect, useState } from "react";
import { Sparkles, Plus, Wrench, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { CHANGELOG, CURRENT_VERSION } from "@/lib/changelog";

const SEEN_KEY = "hyon.changelog.seenVersion";

const TYPE_META = {
  novo:      { label: "Novo",     Icon: Plus,   cls: "bg-primary/10 text-primary border-primary/20" },
  melhoria:  { label: "Melhoria", Icon: Wrench, cls: "bg-info/10 text-info border-info/20" },
  correcao:  { label: "Correção", Icon: Bug,    cls: "bg-warning/10 text-warning border-warning/20" },
} as const;

export function VersionHistoryButton() {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_KEY);
      setHasNew(seen !== CURRENT_VERSION);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (open) {
      try { localStorage.setItem(SEEN_KEY, CURRENT_VERSION); } catch { /* ignore */ }
      setHasNew(false);
    }
  }, [open]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return iso; }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg"
          title={`Novidades — v${CURRENT_VERSION}`}
        >
          <Sparkles className="h-4 w-4" />
          {hasNew && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Novidades do sistema
          </DialogTitle>
          <DialogDescription>
            Histórico de versões e melhorias aplicadas.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6 pb-6">
          <div className="space-y-6">
            {CHANGELOG.map((entry, idx) => (
              <div key={entry.version} className="relative">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold tracking-tight">v{entry.version}</h3>
                    {idx === 0 && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full bg-primary/10 text-primary border-primary/20">
                        ATUAL
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formatDate(entry.date)}</span>
                </div>
                <ul className="space-y-1.5">
                  {entry.changes.map((c, i) => {
                    const meta = TYPE_META[c.type];
                    const Icon = meta.Icon;
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium shrink-0 ${meta.cls}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {meta.label}
                        </span>
                        <span className="text-foreground/90 leading-relaxed">{c.text}</span>
                      </li>
                    );
                  })}
                </ul>
                {idx < CHANGELOG.length - 1 && (
                  <div className="mt-6 border-b border-border/60" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
