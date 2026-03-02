import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_ORDER } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, RotateCcw } from "lucide-react";

export default function Configuracoes() {
  const { configuracoes, updateConfiguracoes, resetDados, exportJSON, importJSON } = useApp();
  const [labels, setLabels] = useState({ ...configuracoes.labelsStatus });
  const [prioridadeLabels, setPrioridadeLabels] = useState({ ...configuracoes.labelsPrioridade });
  const [importText, setImportText] = useState("");

  const saveLabels = () => {
    updateConfiguracoes({ labelsStatus: labels, labelsPrioridade: prioridadeLabels });
    toast({ title: "Labels atualizados!" });
  };

  const handleExport = () => {
    const data = exportJSON();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "gestao-tarefas-backup.json"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Dados exportados!" });
  };

  const handleImport = () => {
    if (importJSON(importText)) {
      toast({ title: "Dados importados com sucesso!" });
      setImportText("");
    } else {
      toast({ title: "Erro ao importar JSON", variant: "destructive" });
    }
  };

  const handleReset = () => {
    resetDados();
    setLabels({ ...configuracoes.labelsStatus });
    setPrioridadeLabels({ ...configuracoes.labelsPrioridade });
    toast({ title: "Dados resetados para o padrão!" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Labels de Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {STATUS_ORDER.map(s => (
            <div key={s} className="flex items-center gap-3">
              <Label className="w-40 text-xs text-muted-foreground">{s}</Label>
              <Input value={labels[s]} onChange={e => setLabels(prev => ({ ...prev, [s]: e.target.value }))} className="h-8" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Labels de Prioridade</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(["baixa", "media", "alta", "urgente"] as const).map(p => (
            <div key={p} className="flex items-center gap-3">
              <Label className="w-40 text-xs text-muted-foreground">{p}</Label>
              <Input value={prioridadeLabels[p]} onChange={e => setPrioridadeLabels(prev => ({ ...prev, [p]: e.target.value }))} className="h-8" />
            </div>
          ))}
          <Button size="sm" onClick={saveLabels}>Salvar Labels</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Aparência</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Modo Compacto</Label>
            <Switch checked={configuracoes.modoCompacto} onCheckedChange={v => updateConfiguracoes({ modoCompacto: v })} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader><CardTitle className="text-base">Dados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5"><Download className="h-3.5 w-3.5" />Exportar JSON</Button>
            <Button variant="destructive" size="sm" onClick={handleReset} className="gap-1.5"><RotateCcw className="h-3.5 w-3.5" />Resetar Dados</Button>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Importar JSON</Label>
            <Textarea value={importText} onChange={e => setImportText(e.target.value)} rows={4} placeholder='Cole o JSON exportado aqui...' />
            <Button size="sm" onClick={handleImport} disabled={!importText.trim()} className="gap-1.5"><Upload className="h-3.5 w-3.5" />Importar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
