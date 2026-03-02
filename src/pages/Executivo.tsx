import { useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Rocket, Headphones, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { calcularScoreSaude, scoreSaudeLabel } from "@/lib/constants";

export default function Executivo() {
  const { clientes, tarefas } = useApp();
  const now = new Date();

  const clientesAtivos = clientes.length;
  const clientesEmImplantacao = tarefas.filter(t => t.tipoOperacional === "implantacao" && !t.implantacaoId && t.status !== "concluida" && t.status !== "cancelada").length;
  const receitaRecorrente = clientes.reduce((a, c) => a + (c.mensalidadeAtual || 0), 0);
  const implantacoesAtrasadas = tarefas.filter(t => t.tipoOperacional === "implantacao" && !t.implantacaoId && t.prazoDataHora && new Date(t.prazoDataHora) < now && t.status !== "concluida").length;
  const chamadosAbertos = tarefas.filter(t => t.tipoOperacional === "suporte" && t.status !== "concluida" && t.status !== "cancelada").length;
  const clientesRisco = clientes.filter(c => c.riscoCancelamento).length;
  const ticketMedio = clientesAtivos > 0 ? Math.round(receitaRecorrente / clientesAtivos) : 0;

  const clientesComScore = useMemo(() => {
    return clientes.map(c => {
      const chamados = tarefas.filter(t => t.tipoOperacional === "suporte" && t.clienteId === c.id);
      const concluidos = chamados.filter(t => t.status === "concluida");
      const tempoMedio = concluidos.length > 0 ? concluidos.reduce((a, t) => a + t.tempoTotalSegundos, 0) / concluidos.length / 3600 : 0;
      const score = calcularScoreSaude(chamados.length, c.statusFinanceiro, tempoMedio);
      const saude = scoreSaudeLabel(score);
      return { ...c, score, saude, chamadosCount: chamados.length };
    }).sort((a, b) => a.score - b.score);
  }, [clientes, tarefas]);

  const kpis = [
    { label: "Clientes Ativos", value: clientesAtivos, icon: Users, color: "text-primary" },
    { label: "Em Implantação", value: clientesEmImplantacao, icon: Rocket, color: "text-purple-600" },
    { label: "Receita Recorrente", value: `R$ ${receitaRecorrente.toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-emerald-600" },
    { label: "Impl. Atrasadas", value: implantacoesAtrasadas, icon: AlertTriangle, color: "text-destructive" },
    { label: "Chamados Abertos", value: chamadosAbertos, icon: Headphones, color: "text-orange-600" },
    { label: "Clientes Risco", value: clientesRisco, icon: AlertTriangle, color: "text-destructive" },
    { label: "Ticket Médio", value: `R$ ${ticketMedio}`, icon: TrendingUp, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Painel Executivo</h1>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Saúde dos Clientes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {clientesComScore.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.sistemaUsado?.toUpperCase() || "—"} · {c.chamadosCount} chamados · R$ {c.mensalidadeAtual || 0}/mês
                  </p>
                </div>
                <Badge className={`text-[10px] ${c.saude.className}`}>{c.saude.label}</Badge>
                <span className="text-sm font-mono font-bold w-8 text-right">{c.score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
