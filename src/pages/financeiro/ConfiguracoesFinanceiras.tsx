import { useState, useEffect } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Download, Upload, RotateCcw, Bell, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { useParametros } from "@/contexts/ParametrosContext";

interface BillingRules {
  id?: string;
  days_before: number[];
  on_due_day: boolean;
  days_after: number[];
  auto_email: boolean;
  auto_whatsapp: boolean;
  auto_task: boolean;
}

export default function ConfiguracoesFinanceiras() {
  const { config, updateConfig, resetFinanceiro, exportFinanceiro, importFinanceiro, contasBancarias, loading } = useFinanceiro();
  const { sistemas: sistemaCatalogo } = useParametros();
  const sistemasAtivos = sistemaCatalogo.filter(s => s.ativo).map(s => s.nome);
  const [diasAlerta, setDiasAlerta] = useState(String(config.diasAlerta));
  const [diasSuspensao, setDiasSuspensao] = useState(String(config.diasSuspensao));
  const [contaPadrao, setContaPadrao] = useState(config.contaBancariaPadraoId);
  const [periodo, setPeriodo] = useState(config.periodoPadraoRelatorio);
  const [custos, setCustos] = useState({ ...config.custoPorSistema });

  // Billing rules state
  const [billingRules, setBillingRules] = useState<BillingRules>({
    days_before: [5],
    on_due_day: true,
    days_after: [3, 7, 15],
    auto_email: false,
    auto_whatsapp: false,
    auto_task: true,
  });
  const [loadingRules, setLoadingRules] = useState(true);
  const [newDayBefore, setNewDayBefore] = useState("");
  const [newDayAfter, setNewDayAfter] = useState("");

  useEffect(() => {
    loadBillingRules();
  }, []);

  const loadBillingRules = async () => {
    try {
      const { data } = await supabase.from("billing_rules").select("*").limit(1).single();
      if (data) {
        setBillingRules({
          id: data.id,
          days_before: data.days_before || [5],
          on_due_day: data.on_due_day ?? true,
          days_after: data.days_after || [3, 7, 15],
          auto_email: data.auto_email ?? false,
          auto_whatsapp: data.auto_whatsapp ?? false,
          auto_task: data.auto_task ?? true,
        });
      }
    } catch {}
    setLoadingRules(false);
  };

  const saveBillingRules = async () => {
    try {
      const { data: profile } = await supabase.from("profiles").select("org_id").limit(1).single();
      if (!profile) return;

      if (billingRules.id) {
        await supabase.from("billing_rules").update({
          days_before: billingRules.days_before,
          on_due_day: billingRules.on_due_day,
          days_after: billingRules.days_after,
          auto_email: billingRules.auto_email,
          auto_whatsapp: billingRules.auto_whatsapp,
          auto_task: billingRules.auto_task,
        }).eq("id", billingRules.id);
      } else {
        const { data } = await supabase.from("billing_rules").insert({
          org_id: profile.org_id,
          days_before: billingRules.days_before,
          on_due_day: billingRules.on_due_day,
          days_after: billingRules.days_after,
          auto_email: billingRules.auto_email,
          auto_whatsapp: billingRules.auto_whatsapp,
          auto_task: billingRules.auto_task,
        }).select("id").single();
        if (data) setBillingRules(prev => ({ ...prev, id: data.id }));
      }
      toast.success("Régua de cobrança salva!");
    } catch {
      toast.error("Erro ao salvar régua");
    }
  };

  const addDayBefore = () => {
    const d = parseInt(newDayBefore);
    if (d > 0 && !billingRules.days_before.includes(d)) {
      setBillingRules(prev => ({ ...prev, days_before: [...prev.days_before, d].sort((a, b) => a - b) }));
      setNewDayBefore("");
    }
  };

  const addDayAfter = () => {
    const d = parseInt(newDayAfter);
    if (d > 0 && !billingRules.days_after.includes(d)) {
      setBillingRules(prev => ({ ...prev, days_after: [...prev.days_after, d].sort((a, b) => a - b) }));
      setNewDayAfter("");
    }
  };

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
      <ModuleNavGrid moduleId="financeiro" />

      {/* Régua de Cobrança */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Régua de Cobrança Automática</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingRules ? <Skeleton className="h-32" /> : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dias antes */}
                <div className="space-y-2">
                  <Label>Dias antes do vencimento</Label>
                  <div className="flex flex-wrap gap-2">
                    {billingRules.days_before.map(d => (
                      <Badge key={d} variant="secondary" className="gap-1">
                        {d} dias
                        <button onClick={() => setBillingRules(prev => ({ ...prev, days_before: prev.days_before.filter(x => x !== d) }))}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Ex: 3" value={newDayBefore} onChange={e => setNewDayBefore(e.target.value)} className="w-24" />
                    <Button size="sm" variant="outline" onClick={addDayBefore}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>

                {/* Dias após */}
                <div className="space-y-2">
                  <Label>Dias após o vencimento</Label>
                  <div className="flex flex-wrap gap-2">
                    {billingRules.days_after.map(d => (
                      <Badge key={d} variant="secondary" className="gap-1">
                        {d} dias
                        <button onClick={() => setBillingRules(prev => ({ ...prev, days_after: prev.days_after.filter(x => x !== d) }))}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Ex: 7" value={newDayAfter} onChange={e => setNewDayAfter(e.target.value)} className="w-24" />
                    <Button size="sm" variant="outline" onClick={addDayAfter}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={billingRules.on_due_day} onCheckedChange={v => setBillingRules(prev => ({ ...prev, on_due_day: v }))} />
                  <Label>Notificar no dia do vencimento</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={billingRules.auto_email} onCheckedChange={v => setBillingRules(prev => ({ ...prev, auto_email: v }))} />
                  <Label>Email automático</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={billingRules.auto_whatsapp} onCheckedChange={v => setBillingRules(prev => ({ ...prev, auto_whatsapp: v }))} />
                  <Label>WhatsApp automático</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={billingRules.auto_task} onCheckedChange={v => setBillingRules(prev => ({ ...prev, auto_task: v }))} />
                  <Label>Criar tarefa automática (7+ dias atraso)</Label>
                </div>
              </div>

              <Button size="sm" onClick={saveBillingRules}><Save className="h-4 w-4 mr-1" /> Salvar Régua</Button>
            </>
          )}
        </CardContent>
      </Card>

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
            {sistemasAtivos.map(s => (
              <div key={s}>
                <Label>{s}</Label>
                <Input type="number" step="0.01" value={custos[s] || 0} onChange={e => setCustos(prev => ({ ...prev, [s]: parseFloat(e.target.value) || 0 }))} />
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
      </div>
    </div>
  );
}
