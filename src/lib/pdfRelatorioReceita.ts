import { ClienteReceita, RECEITA_COLORS, getSystemColor } from "@/types/receita";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pct = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

interface RelatorioMetricas {
  ativosCount: number;
  totalClientes: number;
  mrr: number;
  arr: number;
  ticket: number;
  churnRate: number;
  ltv: number;
  custosTotal: number;
  margem: number;
  margemPercent: number;
  cancelados: number;
}

interface CustoSistema {
  sistema: string;
  valor: number;
  cor: string;
}

interface ClienteStatus {
  status: string;
  count: number;
}

function calcularMetricas(clientes: ClienteReceita[]): RelatorioMetricas {
  const ativos = clientes.filter((c) => c.mensalidadeAtiva);
  const totalClientes = clientes.length;
  const ativosCount = ativos.length;
  const mrr = ativos.reduce((s, c) => s + c.valorMensalidade, 0);
  const arr = mrr * 12;
  const ticket = ativosCount > 0 ? mrr / ativosCount : 0;
  const cancelados = clientes.filter((c) => c.statusCliente === "cancelado").length;
  const churnRate = totalClientes > 0 ? (cancelados / totalClientes) * 100 : 0;
  const ltv = churnRate > 0 ? ticket / (churnRate / 100) : ticket * 120;
  const custosTotal = clientes
    .filter((c) => c.custoAtivo)
    .reduce((s, c) => s + c.valorCustoMensal, 0);
  const margem = mrr - custosTotal;
  const margemPercent = mrr > 0 ? (margem / mrr) * 100 : 0;

  return { ativosCount, totalClientes, mrr, arr, ticket, churnRate, ltv, custosTotal, margem, margemPercent, cancelados };
}

function custosPorSistema(clientes: ClienteReceita[]): CustoSistema[] {
  const systemMap: Record<string, number> = {};
  clientes.filter(c => c.custoAtivo).forEach(c => {
    systemMap[c.sistemaCusto] = (systemMap[c.sistemaCusto] || 0) + c.valorCustoMensal;
  });
  return Object.entries(systemMap)
    .filter(([, valor]) => valor > 0)
    .map(([sistema, valor]) => ({
      sistema,
      valor,
      cor: getSystemColor(sistema),
    }));
}

function clientesPorStatus(clientes: ClienteReceita[]): ClienteStatus[] {
  const map: Record<string, string> = { ativo: "Ativos", atraso: "Em Atraso", suspenso: "Suspensos", cancelado: "Cancelados" };
  return Object.entries(map).map(([key, label]) => ({
    status: label,
    count: clientes.filter((c) => c.statusCliente === key).length,
  }));
}

function sistemasMaisUsados(clientes: ClienteReceita[]) {
  const sysMap: Record<string, number> = {};
  clientes.forEach(c => { sysMap[c.sistemaPrincipal] = (sysMap[c.sistemaPrincipal] || 0) + 1; });
  return Object.entries(sysMap)
    .map(([sistema, count]) => ({ sistema, count }))
    .sort((a, b) => b.count - a.count);
}

function churnLabel(rate: number) {
  if (rate <= 5) return { text: "Excelente", color: "#22c55e" };
  if (rate <= 10) return { text: "Atenção", color: "#f97316" };
  return { text: "Crítico", color: "#ef4444" };
}

function margemLabel(pct: number) {
  if (pct >= 70) return { text: "Excelente", color: "#22c55e" };
  if (pct >= 50) return { text: "Saudável", color: "#3b82f6" };
  if (pct >= 30) return { text: "Atenção", color: "#f97316" };
  return { text: "Revisar custos", color: "#ef4444" };
}

function barChart(items: { label: string; value: number; color: string }[], maxValue: number) {
  return items
    .map((item) => {
      const width = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 2) : 2;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="width:110px;font-size:11px;text-align:right;color:#555;">${item.label}</span>
        <div style="flex:1;background:#f0f0f0;border-radius:4px;height:20px;overflow:hidden;">
          <div style="width:${width}%;background:${item.color};height:100%;border-radius:4px;"></div>
        </div>
        <span style="font-size:11px;font-weight:600;width:50px;">${item.value}</span>
      </div>`;
    })
    .join("");
}

export function gerarRelatorioPDF(clientes: ClienteReceita[]) {
  const m = calcularMetricas(clientes);
  const custos = custosPorSistema(clientes);
  const statuses = clientesPorStatus(clientes);
  const sistemas = sistemasMaisUsados(clientes);
  const cl = churnLabel(m.churnRate);
  const ml = margemLabel(m.margemPercent);
  const dataRelatorio = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const mesRef = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const maxCusto = Math.max(...custos.map((c) => c.valor), 1);
  const maxSistema = Math.max(...sistemas.map((s) => s.count), 1);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório Financeiro — ${mesRef}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:system-ui,-apple-system,sans-serif;color:#1a1a2e;line-height:1.5;padding:40px;background:#fff;}
  .header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid ${RECEITA_COLORS.receita};padding-bottom:16px;margin-bottom:28px;}
  .header h1{font-size:22px;color:${RECEITA_COLORS.receita};}
  .header .meta{text-align:right;font-size:11px;color:#888;}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
  .kpi{border:1px solid #e5e7eb;border-radius:10px;padding:14px;text-align:center;}
  .kpi .label{font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#888;margin-bottom:4px;}
  .kpi .value{font-size:20px;font-weight:700;}
  .kpi .sub{font-size:10px;margin-top:2px;}
  .section{margin-bottom:24px;}
  .section h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${RECEITA_COLORS.receita};margin-bottom:12px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th{background:#f8f9fa;text-align:left;padding:8px;border:1px solid #e5e7eb;font-size:10px;text-transform:uppercase;color:#666;}
  td{padding:8px;border:1px solid #e5e7eb;}
  .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;}
  .footer{margin-top:36px;padding-top:16px;border-top:2px solid #e5e7eb;font-size:10px;color:#aaa;text-align:center;}
  @media print{body{padding:20px;} .kpi-grid{grid-template-columns:repeat(4,1fr);}}
</style></head><body>

<div class="header">
  <div>
    <h1>📊 Relatório Financeiro Mensal</h1>
    <div style="font-size:13px;color:#555;margin-top:4px;">Receita Recorrente — ${mesRef.charAt(0).toUpperCase() + mesRef.slice(1)}</div>
  </div>
  <div class="meta">Gerado em ${dataRelatorio}<br/>GestãoTask — Módulo Receita</div>
</div>

<!-- KPIs -->
<div class="kpi-grid">
  <div class="kpi">
    <div class="label">Clientes Ativos</div>
    <div class="value" style="color:${RECEITA_COLORS.statusAtivo}">${m.ativosCount}</div>
    <div class="sub" style="color:#888;">de ${m.totalClientes} total</div>
  </div>
  <div class="kpi">
    <div class="label">MRR</div>
    <div class="value" style="color:${RECEITA_COLORS.receita}">${fmt(m.mrr)}</div>
    <div class="sub" style="color:#888;">Receita Mensal Recorrente</div>
  </div>
  <div class="kpi">
    <div class="label">ARR</div>
    <div class="value" style="color:${RECEITA_COLORS.receita}">${fmt(m.arr)}</div>
    <div class="sub" style="color:#888;">Receita Anual Recorrente</div>
  </div>
  <div class="kpi">
    <div class="label">Ticket Médio</div>
    <div class="value" style="color:${RECEITA_COLORS.receita}">${fmt(m.ticket)}</div>
    <div class="sub" style="color:#888;">MRR ÷ Ativos</div>
  </div>
  <div class="kpi">
    <div class="label">Churn Rate (12m)</div>
    <div class="value" style="color:${RECEITA_COLORS.churn}">${pct(m.churnRate)}</div>
    <div class="sub" style="color:${cl.color};font-weight:600;">${cl.text}</div>
  </div>
  <div class="kpi">
    <div class="label">LTV</div>
    <div class="value" style="color:${RECEITA_COLORS.receita}">${fmt(m.ltv)}</div>
    <div class="sub" style="color:#888;">Valor Vitalício</div>
  </div>
  <div class="kpi">
    <div class="label">Custos Mensais</div>
    <div class="value" style="color:${RECEITA_COLORS.custos}">${fmt(m.custosTotal)}</div>
    <div class="sub" style="color:#888;">Total de custos ativos</div>
  </div>
  <div class="kpi">
    <div class="label">Margem Líquida</div>
    <div class="value" style="color:${RECEITA_COLORS.margem}">${fmt(m.margem)}</div>
    <div class="sub" style="color:${ml.color};font-weight:600;">${pct(m.margemPercent)} — ${ml.text}</div>
  </div>
</div>

<!-- Charts Section -->
<div class="two-col">
  <div class="section">
    <h2>Custos por Sistema</h2>
    ${barChart(
      custos.map((c) => ({ label: c.sistema, value: Math.round(c.valor * 100) / 100, color: c.cor })),
      maxCusto
    )}
    <div style="margin-top:8px;font-size:11px;color:#888;">
      ${custos.map((c) => `<span style="color:${c.cor};font-weight:600;">${c.sistema}</span>: ${fmt(c.valor)}`).join(" &nbsp;·&nbsp; ")}
    </div>
  </div>

  <div class="section">
    <h2>Sistemas Mais Usados</h2>
    ${barChart(
      sistemas.map((s) => ({ label: s.sistema, value: s.count, color: RECEITA_COLORS.sistemas[s.sistema] })),
      maxSistema
    )}
  </div>
</div>

<div class="two-col">
  <div class="section">
    <h2>Clientes por Status</h2>
    <table>
      <thead><tr><th>Status</th><th style="text-align:center;">Quantidade</th><th style="text-align:center;">%</th></tr></thead>
      <tbody>
        ${statuses
          .map(
            (s) =>
              `<tr><td>${s.status}</td><td style="text-align:center;font-weight:600;">${s.count}</td><td style="text-align:center;">${m.totalClientes > 0 ? pct((s.count / m.totalClientes) * 100) : "0%"}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Resumo Margem</h2>
    <table>
      <thead><tr><th>Métrica</th><th style="text-align:right;">Valor</th></tr></thead>
      <tbody>
        <tr><td>Receita (MRR)</td><td style="text-align:right;color:${RECEITA_COLORS.receita};font-weight:600;">${fmt(m.mrr)}</td></tr>
        <tr><td>Custos Totais</td><td style="text-align:right;color:${RECEITA_COLORS.custos};font-weight:600;">${fmt(m.custosTotal)}</td></tr>
        <tr style="background:#f8f9fa;"><td style="font-weight:700;">Margem Líquida</td><td style="text-align:right;color:${RECEITA_COLORS.margem};font-weight:700;font-size:14px;">${fmt(m.margem)}</td></tr>
        <tr><td>% Margem</td><td style="text-align:right;color:${ml.color};font-weight:600;">${pct(m.margemPercent)} — ${ml.text}</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Top 10 clientes por mensalidade -->
<div class="section">
  <h2>Top 10 Clientes por Mensalidade</h2>
  <table>
    <thead><tr><th>Cliente</th><th>Sistema</th><th>Status</th><th style="text-align:right;">Mensalidade</th><th style="text-align:right;">Custo</th><th style="text-align:right;">Margem</th></tr></thead>
    <tbody>
      ${clientes
        .filter((c) => c.mensalidadeAtiva)
        .sort((a, b) => b.valorMensalidade - a.valorMensalidade)
        .slice(0, 10)
        .map(
          (c) =>
            `<tr>
              <td style="font-weight:500;">${c.nome}</td>
              <td><span class="badge" style="background:${RECEITA_COLORS.sistemas[c.sistemaPrincipal]}20;color:${RECEITA_COLORS.sistemas[c.sistemaPrincipal]};">${c.sistemaPrincipal}</span></td>
              <td>${c.statusCliente}</td>
              <td style="text-align:right;color:${RECEITA_COLORS.receita};">${fmt(c.valorMensalidade)}</td>
              <td style="text-align:right;color:${RECEITA_COLORS.custos};">${fmt(c.valorCustoMensal)}</td>
              <td style="text-align:right;color:${RECEITA_COLORS.margem};font-weight:600;">${fmt(c.valorMensalidade - c.valorCustoMensal)}</td>
            </tr>`
        )
        .join("")}
    </tbody>
  </table>
</div>

<div class="footer">
  Relatório gerado automaticamente pelo sistema GestãoTask — Módulo de Receita Recorrente<br/>
  Dados referentes a ${mesRef.charAt(0).toUpperCase() + mesRef.slice(1)} · ${dataRelatorio}
</div>

</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.onload = () => {
      setTimeout(() => {
        w.print();
      }, 500);
    };
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().slice(0, 7)}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
