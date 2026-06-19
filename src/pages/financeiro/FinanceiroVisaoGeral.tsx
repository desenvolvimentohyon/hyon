import { useState, useEffect } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent, ArrowUpRight, ArrowDownRight, Receipt, Gift } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { STATUS_TITULO_LABELS, ORIGEM_TITULO_LABELS, FINANCEIRO_COLORS, type TituloFinanceiro } from "@/types/financeiro";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from "recharts";

import { fmt, fmtPct, statusColor } from "./visaoGeral/helpers";
import { useFinanceiroDashboard } from "./visaoGeral/useFinanceiroDashboard";
import { DetalheLancamentoDialog } from "./visaoGeral/DetalheLancamentoDialog";

const C = FINANCEIRO_COLORS.raw;
const POR_PAGINA = 10;

export default function Financeiro() {
  const { titulos, contasBancarias, getSaldoConta, loading, updateTitulo, deleteTitulo } = useFinanceiro();
  const { clientesReceita } = useReceita();
  const [periodo, setPeriodo] = useState<string>("12m");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [tituloSelecionado, setTituloSelecionado] = useState<TituloFinanceiro | null>(null);

  useEffect(() => { setPaginaAtual(1); }, [filtroTipo]);

  const { kpis, fluxoCaixa, dreResumo, receitaPorSistema, mrrEvolucao, lancamentosRecentes, lancamentosPorDia } =
    useFinanceiroDashboard(titulos, contasBancarias, getSaldoConta, clientesReceita, filtroTipo);

  const pieCols = [C.receita, C.conciliacao, C.atraso, C.lucro, C.despesa];
  const totalPaginas = Math.ceil(lancamentosRecentes.length / POR_PAGINA);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const itensPaginados = lancamentosRecentes.slice(inicio, inicio + POR_PAGINA);

  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
    </div>
  );

  const kpiCards = [
    { label: "Saldo em Bancos", value: fmt(kpis.saldoBancos), icon: Landmark, color: "text-info" },
    { label: "Contas a Receber", value: fmt(kpis.totalReceber), icon: TrendingUp, color: "text-info" },
    { label: "Contas a Pagar", value: fmt(kpis.totalPagar), icon: TrendingDown, color: "text-destructive" },
    { label: "Inadimplência", value: fmt(kpis.inadimplencia), icon: AlertTriangle, color: "text-warning" },
    { label: "MRR Atual", value: fmt(kpis.mrr), icon: DollarSign, color: "text-info" },
    { label: "Lucro Líquido Mês", value: fmt(kpis.lucro), icon: kpis.lucro >= 0 ? ArrowUpRight : ArrowDownRight, color: kpis.lucro >= 0 ? "text-success" : "text-destructive" },
    { label: "Margem % Mês", value: fmtPct(kpis.margem), icon: Percent, color: kpis.margem >= 0 ? "text-success" : "text-destructive" },
    { label: "Cortesias no Mês", value: `${kpis.cortesiaCount} cliente${kpis.cortesiaCount !== 1 ? "s" : ""}`, secondaryValue: fmt(kpis.cortesiaValor), icon: Gift, color: "text-purple-400" },
  ];

  return (
    <div className="p-6 space-y-6 chart-container">
      <PageHeader
        icon={Landmark}
        iconClassName="text-success"
        title="Financeiro"
        subtitle="Visão geral financeira"
        actions={
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <ModuleNavGrid moduleId="financeiro" />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {kpiCards.map(k => (
          <Card key={k.label} className="group transition-all duration-200 hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={`h-4 w-4 ${k.color}`} />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{k.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{k.value}</p>
              {"secondaryValue" in k && k.secondaryValue && (
                <p className="text-xs text-muted-foreground mt-0.5">{k.secondaryValue}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Fluxo de Caixa (12 meses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill={C.receita} radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill={C.despesa} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">DRE Resumida do Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dreResumo} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis dataKey="nome" type="category" tick={{ fontSize: 11 }} width={80} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {dreResumo.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Receita por Sistema</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={receitaPorSistema} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {receitaPorSistema.map((_, i) => <Cell key={i} fill={pieCols[i % pieCols.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Evolução MRR (12 meses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mrrEvolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="mrr" name="MRR" stroke={C.receita} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-muted-foreground" />Últimos Lançamentos</CardTitle>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="receber">Receitas</SelectItem>
              <SelectItem value="pagar">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        {lancamentosPorDia.length > 0 && (
          <div className="px-6 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lancamentosPorDia} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill={C.receita} radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill={C.despesa} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itensPaginados.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum lançamento encontrado</TableCell></TableRow>
              ) : itensPaginados.map(t => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => setTituloSelecionado(t)}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(t.dataEmissao).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{t.descricao}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={t.tipo === "receber" ? "bg-success/15 text-success border-success/20" : "bg-destructive/15 text-destructive border-destructive/20"}>
                      {t.tipo === "receber" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ORIGEM_TITULO_LABELS[t.origem] || t.origem}</TableCell>
                  <TableCell className={`text-right font-medium text-sm ${t.tipo === "receber" ? "text-success" : "text-destructive"}`}>{fmt(t.valorOriginal)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(t.status)}>
                      {STATUS_TITULO_LABELS[t.status] || t.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPaginas > 1 && (
            <div className="flex flex-col items-center gap-2 py-4 border-t border-border/50">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                      className={paginaAtual <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-sm text-muted-foreground px-3">Página {paginaAtual} de {totalPaginas}</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                      className={paginaAtual >= totalPaginas ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <span className="text-xs text-muted-foreground">{lancamentosRecentes.length} registros</span>
            </div>
          )}
        </CardContent>
      </Card>

      <DetalheLancamentoDialog
        titulo={tituloSelecionado}
        onClose={() => setTituloSelecionado(null)}
        updateTitulo={updateTitulo}
        deleteTitulo={deleteTitulo}
      />
    </div>
  );
}
