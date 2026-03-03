interface SLAReportData {
  periodo: string;
  kpis: { label: string; value: string | number }[];
  taxaCumprimento: number;
  dentroSla: number;
  totalComSla: number;
  satisfacao: number;
  tempoMedioH: number;
  reincidentes: number;
  slaVencido: number;
  porPrioridade: { prioridade: string; horas: number; count: number }[];
  porSistema: { sistema: string; total: number; resolvidos: number }[];
  rankingTecnicos: { nome: string; total: number; resolvidos: number; tempoMedioH: number; taxaSla: number; reincidentes: number; score: number }[];
  chamadosAbertos: { titulo: string; cliente: string; status: string; sla: string }[];
}

function barHtml(value: number, max: number, color: string) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return `<div style="background:#e5e7eb;border-radius:4px;height:14px;width:100%;"><div style="background:${color};height:100%;border-radius:4px;width:${pct}%;"></div></div>`;
}

export function exportSLAPDF(data: SLAReportData) {
  const now = new Date().toLocaleString("pt-BR");
  const maxTempo = Math.max(...data.porPrioridade.map(p => p.horas), 1);
  const maxScore = Math.max(...data.rankingTecnicos.map(t => t.score), 1);

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório SLA - Suporte Técnico</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; background: #fff; padding: 32px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #1e3a5f; }
  .header .meta { text-align: right; font-size: 11px; color: #6b7280; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; text-align: center; }
  .kpi .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 15px; font-weight: 600; color: #1e3a5f; margin-bottom: 12px; border-left: 4px solid #3b82f6; padding-left: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) { background: #fafbfc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-yellow { background: #fef9c3; color: #854d0e; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .gauge { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .gauge-bar { flex: 1; background: #e5e7eb; border-radius: 8px; height: 20px; overflow: hidden; }
  .gauge-fill { height: 100%; border-radius: 8px; transition: width 0.3s; }
  .gauge-value { font-size: 28px; font-weight: 700; min-width: 80px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .highlight-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 16px; } .section { page-break-inside: avoid; } }
</style></head><body>

<div class="header">
  <div><h1>📊 Relatório de SLA — Suporte Técnico</h1><p style="color:#6b7280;font-size:12px;margin-top:4px;">Período: ${data.periodo}</p></div>
  <div class="meta"><p>Gerado em: ${now}</p><p>GestãoTask v3.0</p></div>
</div>

<div class="kpi-grid">
  ${data.kpis.map(k => `<div class="kpi"><div class="label">${k.label}</div><div class="value">${k.value}</div></div>`).join("")}
</div>

<div class="two-col">
  <div class="section">
    <h2>Cumprimento de SLA</h2>
    <div class="highlight-box">
      <div class="gauge">
        <div class="gauge-value" style="color:${data.taxaCumprimento >= 70 ? '#16a34a' : data.taxaCumprimento >= 40 ? '#ca8a04' : '#dc2626'}">${data.taxaCumprimento}%</div>
        <div class="gauge-bar"><div class="gauge-fill" style="width:${data.taxaCumprimento}%;background:${data.taxaCumprimento >= 70 ? '#22c55e' : data.taxaCumprimento >= 40 ? '#eab308' : '#ef4444'}"></div></div>
      </div>
      <p style="font-size:12px;color:#6b7280;">${data.dentroSla} de ${data.totalComSla} chamados resolvidos dentro do prazo</p>
    </div>
  </div>

  <div class="section">
    <h2>Satisfação do Cliente</h2>
    <div class="highlight-box">
      <div class="gauge">
        <div class="gauge-value" style="color:${data.satisfacao >= 80 ? '#16a34a' : data.satisfacao >= 60 ? '#ca8a04' : '#dc2626'}">${data.satisfacao}%</div>
        <div class="gauge-bar"><div class="gauge-fill" style="width:${data.satisfacao}%;background:${data.satisfacao >= 80 ? '#22c55e' : data.satisfacao >= 60 ? '#eab308' : '#ef4444'}"></div></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:8px;">
        <span class="badge badge-red">${data.reincidentes} reincidências</span>
        <span class="badge ${data.slaVencido > 0 ? 'badge-red' : 'badge-green'}">${data.slaVencido} SLA vencidos</span>
        <span class="badge badge-blue">Tempo médio: ${data.tempoMedioH.toFixed(1)}h</span>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <h2>Tempo Médio de Resolução por Prioridade</h2>
  <table>
    <thead><tr><th>Prioridade</th><th>Chamados</th><th>Tempo Médio</th><th style="width:40%">Comparativo</th></tr></thead>
    <tbody>
      ${data.porPrioridade.map(p => `<tr>
        <td><strong>${p.prioridade}</strong></td>
        <td>${p.count}</td>
        <td>${p.horas.toFixed(1)}h</td>
        <td>${barHtml(p.horas, maxTempo, '#3b82f6')}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>

<div class="section">
  <h2>Volume por Sistema</h2>
  <table>
    <thead><tr><th>Sistema</th><th>Total</th><th>Resolvidos</th><th>Taxa Resolução</th></tr></thead>
    <tbody>
      ${data.porSistema.map(s => {
        const taxa = s.total > 0 ? Math.round((s.resolvidos / s.total) * 100) : 0;
        return `<tr>
          <td><strong>${s.sistema}</strong></td>
          <td>${s.total}</td>
          <td>${s.resolvidos}</td>
          <td><span class="badge ${taxa >= 70 ? 'badge-green' : taxa >= 40 ? 'badge-yellow' : 'badge-red'}">${taxa}%</span></td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
</div>

<div class="section">
  <h2>Ranking de Técnicos</h2>
  <table>
    <thead><tr><th>#</th><th>Técnico</th><th>Total</th><th>Resolvidos</th><th>Tempo Médio</th><th>SLA %</th><th>Reincid.</th><th>Score</th><th style="width:20%">Performance</th></tr></thead>
    <tbody>
      ${data.rankingTecnicos.map((t, i) => `<tr>
        <td><strong>${i + 1}</strong></td>
        <td>${i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}${t.nome}</td>
        <td>${t.total}</td>
        <td>${t.resolvidos}</td>
        <td>${t.tempoMedioH.toFixed(1)}h</td>
        <td><span class="badge ${t.taxaSla >= 80 ? 'badge-green' : t.taxaSla >= 50 ? 'badge-yellow' : 'badge-red'}">${t.taxaSla}%</span></td>
        <td>${t.reincidentes > 0 ? `<span class="badge badge-red">${t.reincidentes}</span>` : '—'}</td>
        <td><strong>${Math.round(t.score)}</strong></td>
        <td>${barHtml(t.score, maxScore, '#8b5cf6')}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>

${data.chamadosAbertos.length > 0 ? `
<div class="section">
  <h2>Chamados Abertos (${data.chamadosAbertos.length})</h2>
  <table>
    <thead><tr><th>Chamado</th><th>Cliente</th><th>Status</th><th>SLA</th></tr></thead>
    <tbody>
      ${data.chamadosAbertos.map(c => `<tr>
        <td>${c.titulo}</td>
        <td>${c.cliente}</td>
        <td>${c.status}</td>
        <td><span class="badge ${c.sla === 'Vencido' ? 'badge-red' : c.sla === 'OK' ? 'badge-green' : 'badge-yellow'}">${c.sla}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>` : ''}

<div class="footer">Relatório gerado automaticamente por GestãoTask — ${now}</div>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
