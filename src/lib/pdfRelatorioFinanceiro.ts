const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

interface DRERow {
  mes: string;
  receitas: number;
  repasses: number;
  despesas: number;
  impostos: number;
  lucro: number;
}

interface MRRData {
  mrr: number;
  arr: number;
  ticket: number;
  churn: number;
  ltv: number;
  porSistema: { name: string; value: number }[];
  ativosEmDia: number;
  ativosAtraso: number;
  mrrEmDia: number;
  mrrAtraso: number;
}

function buildPage(title: string, subtitle: string, bodyContent: string): string {
  const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 20mm 15mm; } }
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 40px; color: #1a1a2e; line-height: 1.5; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 28px; }
  .logo { font-size: 22px; font-weight: 700; color: #2563eb; }
  .subtitle { font-size: 12px; color: #666; margin-top: 2px; }
  .date { font-size: 11px; color: #999; text-align: right; }
  .report-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .report-sub { font-size: 12px; color: #666; margin-bottom: 20px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 28px; }
  .kpi { background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
  .kpi .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .kpi .value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
  .kpi .value.blue { color: #2563eb; }
  .kpi .value.green { color: #16a34a; }
  .kpi .value.red { color: #dc2626; }
  .kpi .value.orange { color: #ea580c; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 7px 10px; border: 1px solid #e2e8f0; }
  .text-right { text-align: right; }
  .text-blue { color: #2563eb; }
  .text-red { color: #dc2626; }
  .text-green { color: #16a34a; font-weight: 600; }
  .text-orange { color: #ea580c; }
  .text-gray { color: #6b7280; }
  .bold { font-weight: 700; }
  .section-title { font-size: 14px; font-weight: 600; color: #2563eb; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #e5e7eb; font-size: 10px; color: #999; text-align: center; }
  .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .bar-label { width: 120px; font-size: 12px; font-weight: 500; text-align: right; }
  .bar-track { flex: 1; height: 22px; background: #f1f5f9; border-radius: 4px; overflow: hidden; position: relative; }
  .bar-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding: 0 8px; font-size: 10px; color: #fff; font-weight: 600; min-width: 40px; }
  .bar-value { font-size: 12px; width: 90px; text-align: right; font-weight: 500; }
  .totals-row { background: #f8fafc; font-weight: 700; }
</style></head><body>
<div class="header">
  <div>
    <div class="logo">GestãoTask ERP</div>
    <div class="subtitle">${subtitle}</div>
  </div>
  <div class="date">Gerado em ${now}</div>
</div>
<div class="report-title">${title}</div>
${bodyContent}
<div class="footer">Relatório gerado automaticamente — GestãoTask ERP • ${now}</div>
</body></html>`;
}

export function exportDREPDF(dreData: DRERow[]) {
  const totalReceitas = dreData.reduce((s, d) => s + d.receitas, 0);
  const totalRepasses = dreData.reduce((s, d) => s + d.repasses, 0);
  const totalDespesas = dreData.reduce((s, d) => s + d.despesas, 0);
  const totalImpostos = dreData.reduce((s, d) => s + d.impostos, 0);
  const totalLucro = dreData.reduce((s, d) => s + d.lucro, 0);
  const margemMedia = totalReceitas > 0 ? (totalLucro / totalReceitas) * 100 : 0;

  const kpis = `<div class="kpi-grid">
    <div class="kpi"><div class="label">Receita Total</div><div class="value blue">${fmt(totalReceitas)}</div></div>
    <div class="kpi"><div class="label">Repasses</div><div class="value red">${fmt(totalRepasses)}</div></div>
    <div class="kpi"><div class="label">Despesas Op.</div><div class="value orange">${fmt(totalDespesas)}</div></div>
    <div class="kpi"><div class="label">Impostos</div><div class="value">${fmt(totalImpostos)}</div></div>
    <div class="kpi"><div class="label">Lucro Líquido</div><div class="value ${totalLucro >= 0 ? "green" : "red"}">${fmt(totalLucro)}</div></div>
    <div class="kpi"><div class="label">Margem Média</div><div class="value ${margemMedia >= 0 ? "green" : "red"}">${fmtPct(margemMedia)}</div></div>
  </div>`;

  const tableRows = dreData.map(d => `<tr>
    <td class="bold">${d.mes}</td>
    <td class="text-right text-blue">${fmt(d.receitas)}</td>
    <td class="text-right text-red">${fmt(d.repasses)}</td>
    <td class="text-right text-orange">${fmt(d.despesas)}</td>
    <td class="text-right text-gray">${fmt(d.impostos)}</td>
    <td class="text-right ${d.lucro >= 0 ? "text-green" : "text-red"} bold">${fmt(d.lucro)}</td>
    <td class="text-right">${d.receitas > 0 ? fmtPct((d.lucro / d.receitas) * 100) : "—"}</td>
  </tr>`).join("");

  const totalsRow = `<tr class="totals-row">
    <td class="bold">TOTAL</td>
    <td class="text-right text-blue">${fmt(totalReceitas)}</td>
    <td class="text-right text-red">${fmt(totalRepasses)}</td>
    <td class="text-right text-orange">${fmt(totalDespesas)}</td>
    <td class="text-right text-gray">${fmt(totalImpostos)}</td>
    <td class="text-right ${totalLucro >= 0 ? "text-green" : "text-red"} bold">${fmt(totalLucro)}</td>
    <td class="text-right bold">${fmtPct(margemMedia)}</td>
  </tr>`;

  const body = `
    <div class="report-sub">Período: últimos 12 meses</div>
    ${kpis}
    <div class="section-title">Demonstrativo Detalhado</div>
    <table>
      <thead><tr>
        <th>Mês</th><th class="text-right">Receitas</th><th class="text-right">(-) Repasses</th>
        <th class="text-right">(-) Despesas</th><th class="text-right">(-) Impostos</th>
        <th class="text-right">Lucro Líquido</th><th class="text-right">Margem</th>
      </tr></thead>
      <tbody>${tableRows}${totalsRow}</tbody>
    </table>
    <div class="section-title">Composição da DRE (Acumulado)</div>
    <table>
      <thead><tr><th>Conta</th><th class="text-right">Valor</th><th class="text-right">% da Receita</th></tr></thead>
      <tbody>
        <tr><td>Receitas Brutas</td><td class="text-right text-blue bold">${fmt(totalReceitas)}</td><td class="text-right">100%</td></tr>
        <tr><td>(-) Custos / Repasses</td><td class="text-right text-red">${fmt(totalRepasses)}</td><td class="text-right">${totalReceitas > 0 ? fmtPct((totalRepasses / totalReceitas) * 100) : "—"}</td></tr>
        <tr style="background:#f8fafc;"><td class="bold">(=) Margem Bruta</td><td class="text-right bold">${fmt(totalReceitas - totalRepasses)}</td><td class="text-right bold">${totalReceitas > 0 ? fmtPct(((totalReceitas - totalRepasses) / totalReceitas) * 100) : "—"}</td></tr>
        <tr><td>(-) Despesas Operacionais</td><td class="text-right text-orange">${fmt(totalDespesas)}</td><td class="text-right">${totalReceitas > 0 ? fmtPct((totalDespesas / totalReceitas) * 100) : "—"}</td></tr>
        <tr><td>(-) Impostos</td><td class="text-right text-gray">${fmt(totalImpostos)}</td><td class="text-right">${totalReceitas > 0 ? fmtPct((totalImpostos / totalReceitas) * 100) : "—"}</td></tr>
        <tr class="totals-row"><td class="bold">(=) Lucro Líquido</td><td class="text-right ${totalLucro >= 0 ? "text-green" : "text-red"} bold">${fmt(totalLucro)}</td><td class="text-right bold">${fmtPct(margemMedia)}</td></tr>
      </tbody>
    </table>
  `;

  downloadHTML("DRE-12-meses", buildPage("DRE — Demonstrativo de Resultado", "Relatório Financeiro", body));
}

export function exportMRRPDF(data: MRRData) {
  const kpis = `<div class="kpi-grid">
    <div class="kpi"><div class="label">MRR Atual</div><div class="value blue">${fmt(data.mrr)}</div></div>
    <div class="kpi"><div class="label">ARR (MRR × 12)</div><div class="value blue">${fmt(data.arr)}</div></div>
    <div class="kpi"><div class="label">Ticket Médio</div><div class="value">${fmt(data.ticket)}</div></div>
    <div class="kpi"><div class="label">Churn Rate</div><div class="value ${data.churn > 5 ? "red" : "orange"}">${fmtPct(data.churn)}</div></div>
    <div class="kpi"><div class="label">LTV</div><div class="value green">${fmt(data.ltv)}</div></div>
  </div>`;

  const maxVal = Math.max(...data.porSistema.map(s => s.value), 1);
  const colors = ["#2563eb", "#8b5cf6", "#ea580c", "#16a34a", "#dc2626"];
  const bars = data.porSistema.map((s, i) => {
    const pct = (s.value / maxVal) * 100;
    const color = colors[i % colors.length];
    return `<div class="bar-row">
      <div class="bar-label">${s.name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(pct, 5)}%;background:${color};">${fmtPct(data.mrr > 0 ? (s.value / data.mrr) * 100 : 0)}</div></div>
      <div class="bar-value">${fmt(s.value)}</div>
    </div>`;
  }).join("");

  const body = `
    <div class="report-sub">Métricas de Receita Recorrente Mensal</div>
    ${kpis}
    <div class="section-title">MRR por Sistema</div>
    <div style="margin-bottom:24px;">${bars}</div>
    <table>
      <thead><tr><th>Sistema</th><th class="text-right">MRR</th><th class="text-right">% do Total</th></tr></thead>
      <tbody>
        ${data.porSistema.map(s => `<tr>
          <td class="bold">${s.name}</td>
          <td class="text-right text-blue">${fmt(s.value)}</td>
          <td class="text-right">${data.mrr > 0 ? fmtPct((s.value / data.mrr) * 100) : "—"}</td>
        </tr>`).join("")}
        <tr class="totals-row"><td class="bold">TOTAL</td><td class="text-right text-blue bold">${fmt(data.mrr)}</td><td class="text-right bold">100%</td></tr>
      </tbody>
    </table>
    <div class="section-title">MRR por Status do Cliente</div>
    <table>
      <thead><tr><th>Status</th><th class="text-right">Clientes</th><th class="text-right">MRR</th><th class="text-right">% do MRR</th></tr></thead>
      <tbody>
        <tr><td>✅ Em dia</td><td class="text-right">${data.ativosEmDia}</td><td class="text-right text-green">${fmt(data.mrrEmDia)}</td><td class="text-right">${data.mrr > 0 ? fmtPct((data.mrrEmDia / data.mrr) * 100) : "—"}</td></tr>
        <tr><td>⚠️ Em atraso</td><td class="text-right">${data.ativosAtraso}</td><td class="text-right text-orange">${fmt(data.mrrAtraso)}</td><td class="text-right">${data.mrr > 0 ? fmtPct((data.mrrAtraso / data.mrr) * 100) : "—"}</td></tr>
        <tr class="totals-row"><td class="bold">TOTAL</td><td class="text-right bold">${data.ativosEmDia + data.ativosAtraso}</td><td class="text-right text-blue bold">${fmt(data.mrr)}</td><td class="text-right bold">100%</td></tr>
      </tbody>
    </table>
    <div class="section-title">Indicadores de Saúde</div>
    <table>
      <thead><tr><th>Indicador</th><th class="text-right">Valor</th><th>Observação</th></tr></thead>
      <tbody>
        <tr><td>Ticket Médio</td><td class="text-right bold">${fmt(data.ticket)}</td><td class="text-gray">MRR ÷ Clientes ativos</td></tr>
        <tr><td>Churn Rate</td><td class="text-right ${data.churn > 5 ? "text-red bold" : ""}">${fmtPct(data.churn)}</td><td class="text-gray">Cancelados ÷ Total de clientes</td></tr>
        <tr><td>LTV (Lifetime Value)</td><td class="text-right text-green bold">${fmt(data.ltv)}</td><td class="text-gray">Ticket ÷ Churn decimal</td></tr>
        <tr><td>Razão LTV/Ticket</td><td class="text-right bold">${data.ticket > 0 ? (data.ltv / data.ticket).toFixed(1) + "x" : "—"}</td><td class="text-gray">${data.ticket > 0 && data.ltv / data.ticket > 3 ? "✅ Saudável" : "⚠️ Atenção"}</td></tr>
      </tbody>
    </table>
  `;

  downloadHTML("MRR-Relatorio", buildPage("MRR — Receita Recorrente Mensal", "Relatório de Métricas SaaS", body));
}

function downloadHTML(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
