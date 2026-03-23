import { useState, useMemo, useCallback } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, ComposedChart, Cell, PieChart, Pie, ReferenceLine } from "recharts";
import { FINANCEIRO_COLORS } from "@/types/financeiro";
import { RECEITA_COLORS, SistemaPrincipal } from "@/types/receita";
import { exportDREPDF, exportMRRPDF } from "@/lib/pdfRelatorioFinanceiro";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { Download, TrendingUp, TrendingDown, Target, DollarSign, Users, Percent, Calendar } from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const C = FINANCEIRO_COLORS.raw;

export default function Relatorios() {
  const { titulos, planoContas, loading } = useFinanceiro();
  const { clientesReceita } = useReceita();

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
        <p className="text-muted-foreground text-sm">DRE, MRR, lucratividade e projeções</p>
      </div>
      <ModuleNavGrid moduleId="financeiro" />

      <Tabs defaultValue="dre" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="mrr">MRR</TabsTrigger>
          <TabsTrigger value="lucratividade">Lucratividade</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="dre"><DRETab titulos={titulos} planoContas={planoContas} /></TabsContent>
        <TabsContent value="mrr"><MRRTab clientesReceita={clientesReceita} titulos={titulos} /></TabsContent>
        <TabsContent value="lucratividade"><LucratividadeTab clientesReceita={clientesReceita} titulos={titulos} /></TabsContent>
        <TabsContent value="projecoes"><ProjecoesTab clientesReceita={clientesReceita} /></TabsContent>
        <TabsContent value="comissoes"><ComissoesTab titulos={titulos} /></TabsContent>
      </Tabs>
    </div>
  );
}

function DRETab({ titulos, planoContas }: any) {
  const dreData = useMemo(() => {
    const months: { mes: string; receitas: number; repasses: number; despesas: number; impostos: number; lucro: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const mesTitulos = titulos.filter((t: any) => t.competenciaMes === key && t.status === "pago");
      const receitas = mesTitulos.filter((t: any) => t.tipo === "receber").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      const repasses = mesTitulos.filter((t: any) => t.origem === "repasse").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      const despesas = mesTitulos.filter((t: any) => t.origem === "despesa_operacional").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      const impostos = mesTitulos.filter((t: any) => t.origem === "imposto").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      months.push({ mes: label, receitas, repasses, despesas, impostos, lucro: receitas - repasses - despesas - impostos });
    }
    return months;
  }, [titulos]);

  const handleExportDRE = () => {
    exportDREPDF(dreData);
    toast.success("Relatório DRE exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportDRE}>
          <Download className="h-4 w-4 mr-1" /> Exportar DRE (PDF)
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">DRE - Demonstrativo de Resultado (12 meses)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={dreData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill={C.receita} />
              <Bar dataKey="repasses" name="Repasses" fill={C.despesa} />
              <Bar dataKey="despesas" name="Despesas" fill={C.atraso} />
              <Bar dataKey="impostos" name="Impostos" fill={C.imposto} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke={C.lucro} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">(-) Repasses</TableHead>
                <TableHead className="text-right">(-) Despesas</TableHead>
                <TableHead className="text-right">(-) Impostos</TableHead>
                <TableHead className="text-right font-bold">Lucro Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dreData.map(d => (
                <TableRow key={d.mes}>
                  <TableCell className="font-medium">{d.mes}</TableCell>
                  <TableCell className="text-right text-info">{fmt(d.receitas)}</TableCell>
                  <TableCell className="text-right text-destructive">{fmt(d.repasses)}</TableCell>
                  <TableCell className="text-right text-warning">{fmt(d.despesas)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmt(d.impostos)}</TableCell>
                  <TableCell className={`text-right font-bold ${d.lucro >= 0 ? "text-success" : "text-destructive"}`}>{fmt(d.lucro)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MRRTab({ clientesReceita, titulos }: any) {
  const ativos = clientesReceita.filter((c: any) => c.mensalidadeAtiva);
  const mrr = ativos.reduce((s: number, c: any) => s + c.valorMensalidade, 0);
  const arr = mrr * 12;
  const ticket = ativos.length > 0 ? mrr / ativos.length : 0;
  const cancelados = clientesReceita.filter((c: any) => c.statusCliente === "cancelado").length;
  const churn = clientesReceita.length > 0 ? (cancelados / clientesReceita.length) * 100 : 0;
  const ltv = churn > 0 ? ticket / (churn / 100) : ticket * 100;

  const mrrPorSistema = useMemo(() => {
    const sys: Record<string, number> = {};
    ativos.forEach((c: any) => { sys[c.sistemaPrincipal] = (sys[c.sistemaPrincipal] || 0) + c.valorMensalidade; });
    return Object.entries(sys).map(([name, value]) => ({ name, value }));
  }, [ativos]);

  const pieCols = [C.receita, C.conciliacao, C.atraso, C.lucro, C.despesa];

  const ativosEmDia = clientesReceita.filter((c: any) => c.statusCliente === "ativo" && c.mensalidadeAtiva);
  const ativosAtraso = clientesReceita.filter((c: any) => c.statusCliente === "atraso" && c.mensalidadeAtiva);
  const mrrEmDia = ativosEmDia.reduce((s: number, c: any) => s + c.valorMensalidade, 0);
  const mrrAtraso = ativosAtraso.reduce((s: number, c: any) => s + c.valorMensalidade, 0);

  const handleExportMRR = () => {
    exportMRRPDF({
      mrr, arr, ticket, churn, ltv,
      porSistema: mrrPorSistema,
      ativosEmDia: ativosEmDia.length,
      ativosAtraso: ativosAtraso.length,
      mrrEmDia, mrrAtraso,
    });
    toast.success("Relatório MRR exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportMRR}>
          <Download className="h-4 w-4 mr-1" /> Exportar MRR (PDF)
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "MRR", value: fmt(mrr) },
          { label: "ARR", value: fmt(arr) },
          { label: "Ticket Médio", value: fmt(ticket) },
          { label: "Churn Rate", value: fmtPct(churn) },
          { label: "LTV", value: fmt(ltv) },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-lg font-bold text-foreground">{k.value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">MRR por Sistema</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={mrrPorSistema} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {mrrPorSistema.map((_, i) => <Cell key={i} fill={pieCols[i % pieCols.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">MRR por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { status: "Em dia", valor: clientesReceita.filter((c: any) => c.statusCliente === "ativo" && c.mensalidadeAtiva).reduce((s: number, c: any) => s + c.valorMensalidade, 0) },
                { status: "Atraso", valor: clientesReceita.filter((c: any) => c.statusCliente === "atraso" && c.mensalidadeAtiva).reduce((s: number, c: any) => s + c.valorMensalidade, 0) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="status" className="fill-muted-foreground" />
                <YAxis className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  <Cell fill={C.lucro} />
                  <Cell fill={C.atraso} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LucratividadeTab({ clientesReceita, titulos }: any) {
  const ranking = useMemo(() => {
    return clientesReceita
      .filter((c: any) => c.mensalidadeAtiva)
      .map((c: any) => ({
        nome: c.nome,
        sistema: c.sistemaPrincipal,
        receita: c.valorMensalidade,
        custo: c.valorCustoMensal,
        margem: c.valorMensalidade - c.valorCustoMensal,
        margemPct: c.valorMensalidade > 0 ? ((c.valorMensalidade - c.valorCustoMensal) / c.valorMensalidade) * 100 : 0,
      }))
      .sort((a: any, b: any) => b.margem - a.margem);
  }, [clientesReceita]);

  const porSistema = useMemo(() => {
    const sys: Record<string, { receita: number; custo: number }> = {};
    clientesReceita.filter((c: any) => c.mensalidadeAtiva).forEach((c: any) => {
      if (!sys[c.sistemaPrincipal]) sys[c.sistemaPrincipal] = { receita: 0, custo: 0 };
      sys[c.sistemaPrincipal].receita += c.valorMensalidade;
      sys[c.sistemaPrincipal].custo += c.valorCustoMensal;
    });
    return Object.entries(sys).map(([name, v]) => ({ name, ...v, margem: v.receita - v.custo }));
  }, [clientesReceita]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm">Margem por Sistema</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porSistema}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="receita" name="Receita" fill={C.receita} />
              <Bar dataKey="custo" name="Custo" fill={C.despesa} />
              <Bar dataKey="margem" name="Margem" fill={C.lucro} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Ranking de Clientes por Margem</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.slice(0, 20).map((r: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                  <TableCell className="font-medium text-sm">{r.nome}</TableCell>
                  <TableCell className="text-sm">{r.sistema}</TableCell>
                  <TableCell className="text-right text-sm text-info">{fmt(r.receita)}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">{fmt(r.custo)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold text-success">{fmt(r.margem)}</TableCell>
                  <TableCell className="text-right text-sm">{fmtPct(r.margemPct)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjecoesTab({ clientesReceita }: any) {
  // ── Cenários editáveis ──
  const [cenarios, setCenarios] = useState([
    { id: "conservador", nome: "Conservador", crescimento: 1.5, churn: 3, novosClientes: 1, ticketNovos: 0, cor: C.imposto, dash: "5 5", ativo: true },
    { id: "base", nome: "Base", crescimento: 3, churn: 2, novosClientes: 2, ticketNovos: 0, cor: C.receita, dash: "", ativo: true },
    { id: "agressivo", nome: "Agressivo", crescimento: 5, churn: 1, novosClientes: 4, ticketNovos: 0, cor: C.lucro, dash: "5 5", ativo: true },
  ]);
  const [horizonte, setHorizonte] = useState(12);
  const [mostrarLucro, setMostrarLucro] = useState(true);
  const [mostrarArea, setMostrarArea] = useState(true);

  const ativos = clientesReceita.filter((c: any) => c.mensalidadeAtiva);
  const mrrAtual = ativos.reduce((s: number, c: any) => s + c.valorMensalidade, 0);
  const custoAtual = ativos.reduce((s: number, c: any) => s + c.valorCustoMensal, 0);
  const ticketMedio = ativos.length > 0 ? mrrAtual / ativos.length : 0;

  // Inicializar ticketNovos com ticket médio atual
  const cenariosComTicket = cenarios.map(c => ({ ...c, ticketNovos: c.ticketNovos || ticketMedio }));

  const updateCenario = useCallback((id: string, field: string, value: number | boolean | string) => {
    setCenarios(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const projecoes = useMemo(() => {
    const data: any[] = [];
    for (let i = 0; i <= horizonte; i++) {
      const mesLabel = i === 0 ? "Atual" : `M${i}`;
      const row: any = { mes: mesLabel, mesNum: i };
      cenariosComTicket.filter(c => c.ativo).forEach(c => {
        const crescMensal = c.crescimento / 100;
        const churnMensal = c.churn / 100 / 12;
        // MRR orgânico + novos clientes
        let mrr = mrrAtual;
        for (let m = 0; m < i; m++) {
          mrr = mrr * (1 + crescMensal - churnMensal) + (c.novosClientes * (c.ticketNovos || ticketMedio));
        }
        const custoProj = custoAtual * Math.pow(1 + crescMensal * 0.3, i);
        row[`mrr_${c.id}`] = Math.round(mrr);
        row[`lucro_${c.id}`] = Math.round(mrr - custoProj);
        row[`arr_${c.id}`] = Math.round(mrr * 12);
      });
      data.push(row);
    }
    return data;
  }, [cenariosComTicket, horizonte, mrrAtual, custoAtual, ticketMedio]);

  // KPIs finais por cenário
  const kpiFinais = cenariosComTicket.filter(c => c.ativo).map(c => {
    const ultimo = projecoes[projecoes.length - 1];
    const mrrFinal = ultimo?.[`mrr_${c.id}`] || 0;
    const lucroFinal = ultimo?.[`lucro_${c.id}`] || 0;
    const arrFinal = ultimo?.[`arr_${c.id}`] || 0;
    const crescTotal = mrrAtual > 0 ? ((mrrFinal - mrrAtual) / mrrAtual) * 100 : 0;
    return { ...c, mrrFinal, lucroFinal, arrFinal, crescTotal };
  });

  return (
    <div className="space-y-6">
      {/* Controles globais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" />Parâmetros Globais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" />Horizonte</Label>
                <Badge variant="outline">{horizonte} meses</Badge>
              </div>
              <Slider value={[horizonte]} onValueChange={([v]) => setHorizonte(v)} min={3} max={36} step={3} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={mostrarLucro} onCheckedChange={setMostrarLucro} />
              <Label>Mostrar lucro projetado</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={mostrarArea} onCheckedChange={setMostrarArea} />
              <Label>Gráfico de área (preenchido)</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cenários editáveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cenariosComTicket.map(c => (
          <Card key={c.id} className={`transition-opacity ${c.ativo ? "" : "opacity-50"}`} style={{ borderColor: c.ativo ? c.cor : undefined, borderWidth: c.ativo ? 2 : 1 }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ color: c.cor }}>{c.nome}</CardTitle>
                <Switch checked={c.ativo} onCheckedChange={v => updateCenario(c.id, "ativo", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Crescimento mensal</span>
                  <span className="font-medium">{c.crescimento}%</span>
                </div>
                <Slider value={[c.crescimento]} onValueChange={([v]) => updateCenario(c.id, "crescimento", v)} min={0} max={10} step={0.5} disabled={!c.ativo} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" />Churn anual</span>
                  <span className="font-medium">{c.churn}%</span>
                </div>
                <Slider value={[c.churn]} onValueChange={([v]) => updateCenario(c.id, "churn", v)} min={0} max={15} step={0.5} disabled={!c.ativo} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Novos clientes/mês</span>
                  <span className="font-medium">{c.novosClientes}</span>
                </div>
                <Slider value={[c.novosClientes]} onValueChange={([v]) => updateCenario(c.id, "novosClientes", v)} min={0} max={10} step={1} disabled={!c.ativo} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><DollarSign className="h-3 w-3" />Ticket novos clientes</Label>
                <Input type="number" value={Math.round(c.ticketNovos || ticketMedio)} onChange={e => updateCenario(c.id, "ticketNovos", parseFloat(e.target.value) || 0)} disabled={!c.ativo} className="h-8 text-sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPIs de resultado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiFinais.map(k => (
          <Card key={k.id} style={{ borderTop: `3px solid ${k.cor}` }}>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">{k.nome} — em {horizonte} meses</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">MRR Final</p>
                  <p className="font-bold">{fmt(k.mrrFinal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ARR Final</p>
                  <p className="font-bold">{fmt(k.arrFinal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lucro Proj.</p>
                  <p className={`font-bold ${k.lucroFinal >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(k.lucroFinal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Crescimento</p>
                  <p className={`font-bold ${k.crescTotal >= 0 ? "text-emerald-600" : "text-destructive"}`}>{k.crescTotal >= 0 ? "+" : ""}{k.crescTotal.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico principal */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Projeção MRR — Cenários Comparados</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={380}>
            {mostrarArea ? (
              <AreaChart data={projecoes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <ReferenceLine y={mrrAtual} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "MRR Atual", position: "right", fontSize: 10 }} />
                {cenariosComTicket.filter(c => c.ativo).map(c => (
                  <Area key={c.id} type="monotone" dataKey={`mrr_${c.id}`} name={c.nome} stroke={c.cor} fill={c.cor} fillOpacity={0.08} strokeWidth={c.id === "base" ? 2.5 : 1.5} strokeDasharray={c.dash} />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={projecoes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <ReferenceLine y={mrrAtual} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "MRR Atual", position: "right", fontSize: 10 }} />
                {cenariosComTicket.filter(c => c.ativo).map(c => (
                  <Line key={c.id} type="monotone" dataKey={`mrr_${c.id}`} name={c.nome} stroke={c.cor} strokeWidth={c.id === "base" ? 2.5 : 1.5} strokeDasharray={c.dash} dot={false} />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de lucro */}
      {mostrarLucro && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Projeção de Lucro por Cenário</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={projecoes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                {cenariosComTicket.filter(c => c.ativo).map(c => (
                  <Area key={c.id} type="monotone" dataKey={`lucro_${c.id}`} name={`Lucro ${c.nome}`} stroke={c.cor} fill={c.cor} fillOpacity={0.05} strokeWidth={1.5} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela comparativa */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Tabela Comparativa Mensal</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  {cenariosComTicket.filter(c => c.ativo).map(c => (
                    <TableHead key={c.id} className="text-right" style={{ color: c.cor }}>{c.nome}</TableHead>
                  ))}
                  {mostrarLucro && cenariosComTicket.filter(c => c.ativo).map(c => (
                    <TableHead key={`l_${c.id}`} className="text-right text-xs" style={{ color: c.cor }}>Lucro {c.nome}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projecoes.filter((_, i) => i % Math.max(1, Math.floor(horizonte / 12)) === 0 || i === projecoes.length - 1).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{row.mes}</TableCell>
                    {cenariosComTicket.filter(c => c.ativo).map(c => (
                      <TableCell key={c.id} className="text-right text-sm">{fmt(row[`mrr_${c.id}`] || 0)}</TableCell>
                    ))}
                    {mostrarLucro && cenariosComTicket.filter(c => c.ativo).map(c => (
                      <TableCell key={`l_${c.id}`} className={`text-right text-sm ${(row[`lucro_${c.id}`] || 0) >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {fmt(row[`lucro_${c.id}`] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComissoesTab({ titulos }: any) {
  const comissoes = titulos.filter((t: any) => t.origem === "comissao");
  const total = comissoes.reduce((s: number, t: any) => s + t.valorOriginal, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total de comissões pagas</p>
          <p className="text-2xl font-bold text-foreground">{fmt(total)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Beneficiário</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{t.descricao}</TableCell>
                  <TableCell className="text-sm">{t.fornecedorNome || "—"}</TableCell>
                  <TableCell className="text-sm">{t.competenciaMes}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{fmt(t.valorOriginal)}</TableCell>
                  <TableCell className="text-sm">{t.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
