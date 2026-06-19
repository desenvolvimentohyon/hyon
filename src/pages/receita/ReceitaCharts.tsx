import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RECEITA_COLORS, getSystemColor } from "@/types/receita";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart,
} from "recharts";
import { fmt, fmtShort } from "./useReceitaMetricas";

interface Props {
  data: ReturnType<typeof import("./useReceitaMetricas").useReceitaMetricas>;
}

export function ReceitaCharts({ data }: Props) {
  const {
    metricas, churnLabel, mrrTimeline, arrVsMrr, ticketDistribution,
    churnTimeline, custosPorSistema, margemData, clientesPorStatus, sistemasMaisUsados, topSuporteClientes,
  } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">MRR ao Longo do Tempo</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={mrrTimeline}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="mrr" stroke={RECEITA_COLORS.receita} fill={RECEITA_COLORS.receita} fillOpacity={0.15} name="MRR" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">ARR (projeção) vs MRR</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={arrVsMrr}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="MRR" fill={RECEITA_COLORS.receita} radius={[4, 4, 0, 0]} />
              <Bar dataKey="ARR" fill={`${RECEITA_COLORS.receita}66`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Distribuição de Mensalidades</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ticketDistribution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip />
              <Bar dataKey="clientes" fill={RECEITA_COLORS.receita} radius={[4, 4, 0, 0]} name="Clientes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Churn (12 meses)
            <Badge className={`text-[10px] ${churnLabel.color === "text-success" ? "bg-success/10 text-success" : churnLabel.color === "text-warning" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
              {fmtShort(metricas.churnRate)}% — {churnLabel.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={churnTimeline}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="cancelamentos" fill={RECEITA_COLORS.churn} radius={[4, 4, 0, 0]} name="Cancelamentos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Custos por Sistema</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={custosPorSistema} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${fmt(value)}`} labelLine={false}>
                {custosPorSistema.map((entry) => <Cell key={entry.name} fill={getSystemColor(entry.name)} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">MRR vs Custos vs Margem</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={margemData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="MRR" fill={RECEITA_COLORS.receita} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Custos" fill={RECEITA_COLORS.custos} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Margem" stroke={RECEITA_COLORS.margem} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Clientes por Status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={clientesPorStatus} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" nameKey="name" label>
                {clientesPorStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Sistemas Mais Usados</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sistemasMaisUsados} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={100} />
              <Tooltip />
              <Bar dataKey="clientes" name="Clientes" radius={[0, 4, 4, 0]}>
                {sistemasMaisUsados.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-sm">Top 10 Clientes — Ocorrências de Suporte</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSuporteClientes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={160} />
              <Tooltip />
              <Bar dataKey="ocorrencias" fill={RECEITA_COLORS.suporte} radius={[0, 4, 4, 0]} name="Ocorrências" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
