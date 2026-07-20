import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Instagram, Link2, Check } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "hyon:landing-custom-url";
const DEFAULT_PATH = "/bio";

export default function LandingLinkCard() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const defaultUrl = useMemo(() => {
    // Prefer canonical published domain when running on lovable preview
    if (origin.includes("lovable.app") || origin.includes("localhost")) {
      return `https://hyon.com.br${DEFAULT_PATH}`;
    }
    return `${origin}${DEFAULT_PATH}`;
  }, [origin]);

  const [customUrl, setCustomUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCustomUrl(saved);
  }, []);

  const activeUrl = (customUrl.trim() || defaultUrl).replace(/\/$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      toast.success("Link copiado! Cole na bio do Instagram.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.");
    }
  };

  const handleSave = () => {
    const v = customUrl.trim();
    if (v) {
      try {
        new URL(v);
      } catch {
        toast.error("Informe uma URL válida (com https://).");
        return;
      }
      localStorage.setItem(STORAGE_KEY, v);
      toast.success("Link personalizado salvo!");
    } else {
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Voltamos ao link padrão.");
    }
  };

  const openPreview = () => window.open(activeUrl, "_blank", "noopener,noreferrer");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4 text-fuchsia-500" />
            Link da Landing Page
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Link ativo</Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 font-mono text-sm break-all">
                <Badge variant="secondary" className="shrink-0">Ativo</Badge>
                <span>{activeUrl}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopy} className="gap-1.5" size="sm">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
                <Button variant="outline" size="sm" onClick={openPreview} className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Rota padrão: <code>{DEFAULT_PATH}</code> — acessível também em subdomínios/domínios personalizados apontando para este projeto.
            </p>
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="custom-landing" className="text-xs text-muted-foreground">
              Personalizar link (opcional)
            </Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="custom-landing"
                placeholder="https://seudominio.com/bio"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="h-9"
              />
              <Button size="sm" variant="secondary" onClick={handleSave}>Salvar</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Use se você configurou um subdomínio próprio (ex.: <code>bio.hyon.com.br</code>). Deixe em branco para usar o padrão.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Instagram className="h-4 w-4 text-pink-500" />
            Como usar no Instagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Copie o link ativo acima.</li>
            <li>Abra o Instagram → seu perfil → <strong>Editar perfil</strong>.</li>
            <li>Cole em <strong>Site</strong> (campo de bio) e salve.</li>
            <li>Pronto — visitantes verão a landing page em qualquer dispositivo.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
