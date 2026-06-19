import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Target, DollarSign, Users, Calendar } from "lucide-react";
import { fmt, C } from "./helpers";

export function ProjecoesTab({ clientesReceita }: any) {
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
