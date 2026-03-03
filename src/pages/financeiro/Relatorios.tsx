import { useState, useMemo } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart, Cell, PieChart, Pie } from "recharts";
import { FINANCEIRO_COLORS } from "@/types/financeiro";
import { RECEITA_COLORS, SistemaPrincipal } from "@/types/receita";

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

  return (
    <div className="space-y-6">
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

  return (
    <div className="space-y-6">
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
  const [crescimento, setCrescimento] = useState("3");
  const [churnRate, setChurnRate] = useState("2");
  const [horizonte, setHorizonte] = useState("12");
  const [novosClientes, setNovosClientes] = useState("2");

  const ativos = clientesReceita.filter((c: any) => c.mensalidadeAtiva);
  const mrrAtual = ativos.reduce((s: number, c: any) => s + c.valorMensalidade, 0);
  const custoAtual = ativos.reduce((s: number, c: any) => s + c.valorCustoMensal, 0);

  const projecoes = useMemo(() => {
    const h = parseInt(horizonte);
    const cresc = parseFloat(crescimento) / 100;
    const ch = parseFloat(churnRate) / 100;
    const data: { mes: number; conservador: number; base: number; agressivo: number; lucroBase: number }[] = [];
    for (let i = 0; i <= h; i++) {
      const base = mrrAtual * Math.pow(1 + cresc - ch / 12, i);
      const conservador = mrrAtual * Math.pow(1 + cresc * 0.5 - ch / 12, i);
      const agressivo = mrrAtual * Math.pow(1 + cresc * 1.5 - ch / 12, i);
      const custoProj = custoAtual * Math.pow(1 + cresc * 0.3, i);
      data.push({ mes: i, conservador, base, agressivo, lucroBase: base - custoProj });
    }
    return data;
  }, [mrrAtual, custoAtual, crescimento, churnRate, horizonte]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm">Parâmetros de Projeção</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><Label>Crescimento mensal %</Label><Input type="number" value={crescimento} onChange={e => setCrescimento(e.target.value)} /></div>
            <div><Label>Churn rate anual %</Label><Input type="number" value={churnRate} onChange={e => setChurnRate(e.target.value)} /></div>
            <div><Label>Horizonte (meses)</Label>
              <Select value={horizonte} onValueChange={setHorizonte}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Novos clientes/mês</Label><Input type="number" value={novosClientes} onChange={e => setNovosClientes(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Projeção MRR - Cenários</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={projecoes}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" label={{ value: "Meses", position: "insideBottom", offset: -5 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="conservador" name="Conservador" stroke={C.imposto} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="base" name="Base" stroke={C.receita} strokeWidth={2} />
              <Line type="monotone" dataKey="agressivo" name="Agressivo" stroke={C.lucro} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="lucroBase" name="Lucro (Base)" stroke={C.atraso} strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
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
