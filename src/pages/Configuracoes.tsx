import { useState, lazy, Suspense } from "react";
import { useApp } from "@/contexts/AppContext";
import { usePropostas } from "@/contexts/PropostasContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_ORDER } from "@/types";
import { FormaEnvio } from "@/types/propostas";
import { MetricasConfig } from "@/types/receita";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, RotateCcw, Plus, Trash2, GripVertical, Loader2, Building2, Settings } from "lucide-react";


const MinhaEmpresa = lazy(() => import("@/components/configuracoes/MinhaEmpresa"));

export default function Configuracoes() {
  const { configuracoes, updateConfiguracoes, resetDados, exportJSON, importJSON } = useApp();
  const { crmConfig, updateCRMConfig, resetCRMConfig, resetPropostas } = usePropostas();
  const { metricasConfig, updateMetricasConfig, resetReceita } = useReceita();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [labels, setLabels] = useState({ ...configuracoes.labelsStatus });
  const [prioridadeLabels, setPrioridadeLabels] = useState({ ...configuracoes.labelsPrioridade });
  const [importText, setImportText] = useState("");


  // CRM config local state
  const [crmStatusList, setCrmStatusList] = useState([...crmConfig.statusKanban]);
  const [novoStatus, setNovoStatus] = useState("");
  const [crmForma, setCrmForma] = useState(crmConfig.formaEnvioPadrao);
  const [crmMensagem, setCrmMensagem] = useState(crmConfig.mensagemPadraoEnvio);
  const [crmValidade, setCrmValidade] = useState(crmConfig.validadePadraoDias);
  const [crmEmpresa, setCrmEmpresa] = useState(crmConfig.nomeEmpresa);
  const [crmRodape, setCrmRodape] = useState(crmConfig.rodapePDF);
  const [crmInfoPadrao, setCrmInfoPadrao] = useState(crmConfig.informacoesAdicionaisPadrao);
  const [crmAssinatura, setCrmAssinatura] = useState(crmConfig.exibirAssinaturaDigitalFake);

  // Metricas config
  const [metPeriodo, setMetPeriodo] = useState<string>(metricasConfig.periodoPadrao);
  const [metChurnWindow, setMetChurnWindow] = useState(metricasConfig.churnWindowMeses);
  const [metMoeda, setMetMoeda] = useState(metricasConfig.moeda);

  const saveLabels = () => {
    updateConfiguracoes({ labelsStatus: labels, labelsPrioridade: prioridadeLabels });
    toast({ title: "Labels atualizados!" });
  };

  const saveCRM = () => {
    updateCRMConfig({
      statusKanban: crmStatusList,
      formaEnvioPadrao: crmForma,
      mensagemPadraoEnvio: crmMensagem,
      validadePadraoDias: crmValidade,
      nomeEmpresa: crmEmpresa,
      rodapePDF: crmRodape,
      informacoesAdicionaisPadrao: crmInfoPadrao,
      exibirAssinaturaDigitalFake: crmAssinatura,
    });
    toast({ title: "Configurações de propostas salvas!" });
  };

  const addCrmStatus = () => {
    const s = novoStatus.trim();
    if (s && !crmStatusList.includes(s)) {
      setCrmStatusList(prev => [...prev, s]);
      setNovoStatus("");
    }
  };

  const removeCrmStatus = (s: string) => setCrmStatusList(prev => prev.filter(x => x !== s));

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
    resetPropostas();
    resetReceita();
    setLabels({ ...configuracoes.labelsStatus });
    setPrioridadeLabels({ ...configuracoes.labelsPrioridade });
    toast({ title: "Dados resetados para o padrão!" });
  };

  const saveMetricas = () => {
    updateMetricasConfig({ periodoPadrao: metPeriodo as MetricasConfig["periodoPadrao"], churnWindowMeses: metChurnWindow, moeda: metMoeda });
    toast({ title: "Configurações de métricas salvas!" });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="geral" className="gap-1.5"><Settings className="h-4 w-4" />Configurações Gerais</TabsTrigger>
          {isAdmin && <TabsTrigger value="empresa" className="gap-1.5"><Building2 className="h-4 w-4" />Minha Empresa</TabsTrigger>}
        </TabsList>

        <TabsContent value="geral">
          <div className="space-y-6">
            {/* All existing config cards below */}
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
              <CardHeader><CardTitle className="text-base">Propostas — CRM Pipeline</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium">Status do Pipeline (colunas Kanban)</Label>
                  <div className="space-y-1 mt-2">
                    {crmStatusList.map((s) => (
                      <div key={s} className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm flex-1">{s}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCrmStatus(s)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input className="h-8" placeholder="Novo status..." value={novoStatus} onChange={e => setNovoStatus(e.target.value)} onKeyDown={e => e.key === "Enter" && addCrmStatus()} />
                    <Button size="sm" variant="outline" onClick={addCrmStatus} className="gap-1"><Plus className="h-3 w-3" />Adicionar</Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs">Forma de Envio Padrão</Label>
                  <Select value={crmForma} onValueChange={v => setCrmForma(v as FormaEnvio)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="manual_link">Link Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Mensagem Padrão de Envio</Label>
                  <Textarea rows={3} value={crmMensagem} onChange={e => setCrmMensagem(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Variáveis: {"{cliente}"}, {"{numeroProposta}"}, {"{sistema}"}, {"{mensalidade}"}, {"{implantacao}"}, {"{linkAceite}"}, {"{validade}"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Validade Padrão (dias)</Label>
                    <Input type="number" className="h-8" value={crmValidade} onChange={e => setCrmValidade(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Nome da Empresa</Label>
                    <Input className="h-8" value={crmEmpresa} onChange={e => setCrmEmpresa(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Rodapé PDF</Label>
                  <Input className="h-8" value={crmRodape} onChange={e => setCrmRodape(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Informações Adicionais Padrão</Label>
                  <Textarea rows={2} value={crmInfoPadrao} onChange={e => setCrmInfoPadrao(e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Assinatura Digital Fake no PDF</Label>
                  <Switch checked={crmAssinatura} onCheckedChange={setCrmAssinatura} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveCRM}>Salvar Configurações</Button>
                  <Button size="sm" variant="outline" onClick={() => { resetCRMConfig(); toast({ title: "Config CRM restaurada!" }); }}>Restaurar Padrão</Button>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <Card>
              <CardHeader><CardTitle className="text-base">Métricas & Receita</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Período Padrão do Dashboard</Label>
                    <Select value={metPeriodo} onValueChange={setMetPeriodo}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30d">30 dias</SelectItem>
                        <SelectItem value="90d">90 dias</SelectItem>
                        <SelectItem value="12m">12 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Churn Window (meses)</Label>
                    <Input type="number" className="h-8" value={metChurnWindow} onChange={e => setMetChurnWindow(Number(e.target.value))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Moeda / Formatação</Label>
                  <Select value={metMoeda} onValueChange={setMetMoeda}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">R$ (BRL - pt-BR)</SelectItem>
                      <SelectItem value="USD">$ (USD - en-US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveMetricas}>Salvar Métricas</Button>
                  <Button size="sm" variant="outline" onClick={() => { resetReceita(); toast({ title: "Dados de receita resetados!" }); }}>Resetar Dados Receita</Button>
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
        </TabsContent>

        {isAdmin && (
          <TabsContent value="empresa">
            <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
              <MinhaEmpresa />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
