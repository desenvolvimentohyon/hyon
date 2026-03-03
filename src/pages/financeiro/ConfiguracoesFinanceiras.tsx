import { useState } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Download, Upload, RotateCcw } from "lucide-react";
import { SistemaPrincipal } from "@/types/receita";

const sistemas: SistemaPrincipal[] = ["PDV+", "LinkPro", "Torge", "Emissor Fiscal", "Hyon Hospede"];

export default function ConfiguracoesFinanceiras() {
  const { config, updateConfig, resetFinanceiro, exportFinanceiro, importFinanceiro, contasBancarias, loading } = useFinanceiro();
  const [diasAlerta, setDiasAlerta] = useState(String(config.diasAlerta));
  const [diasSuspensao, setDiasSuspensao] = useState(String(config.diasSuspensao));
  const [contaPadrao, setContaPadrao] = useState(config.contaBancariaPadraoId);
  const [periodo, setPeriodo] = useState(config.periodoPadraoRelatorio);
  const [custos, setCustos] = useState({ ...config.custoPorSistema });

  const handleSave = () => {
    updateConfig({
      diasAlerta: parseInt(diasAlerta),
      diasSuspensao: parseInt(diasSuspensao),
      contaBancariaPadraoId: contaPadrao,
      periodoPadraoRelatorio: periodo as any,
      custoPorSistema: custos,
    });
    toast.success("Configurações salvas!");
  };

  const handleExport = () => {
    const json = exportFinanceiro();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "financeiro-backup.json"; a.click();
    toast.success("Dados exportados!");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = importFinanceiro(ev.target?.result as string);
        if (ok) toast.success("Dados importados!");
        else toast.error("Erro ao importar");
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    resetFinanceiro();
    toast.success("Dados financeiros resetados para seed!");
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações Financeiras</h1>
        <p className="text-muted-foreground text-sm">Parâmetros e regras do módulo financeiro</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inadimplência */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Regras de Inadimplência</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Dias para alertar</Label><Input type="number" value={diasAlerta} onChange={e => setDiasAlerta(e.target.value)} /></div>
            <div><Label>Dias para sugerir suspensão</Label><Input type="number" value={diasSuspensao} onChange={e => setDiasSuspensao(e.target.value)} /></div>
          </CardContent>
        </Card>

        {/* Padrões */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Padrões</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Conta bancária padrão</Label>
              <Select value={contaPadrao} onValueChange={setContaPadrao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{contasBancarias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Período padrão dos relatórios</Label>
              <Select value={periodo} onValueChange={v => setPeriodo(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                  <SelectItem value="12m">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custos por sistema */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Custo de Repasse por Sistema (por cliente ativo)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {sistemas.map(s => (
              <div key={s}>
                <Label>{s}</Label>
                <Input type="number" step="0.01" value={custos[s]} onChange={e => setCustos(prev => ({ ...prev, [s]: parseFloat(e.target.value) || 0 }))} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Ações */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Salvar Configurações</Button>
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Exportar JSON</Button>
        <Button variant="outline" onClick={handleImport}><Upload className="h-4 w-4 mr-1" /> Importar JSON</Button>
        <Button variant="destructive" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-1" /> Resetar Seed</Button>
      </div>
    </div>
  );
}
