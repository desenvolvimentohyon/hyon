import { Proposta, CRMConfig } from "@/types/propostas";

export function gerarPDFProposta(proposta: Proposta, config: CRMConfig) {
  const fluxo = proposta.fluxoPagamentoImplantacao === "a_vista"
    ? "À vista"
    : `${proposta.parcelasImplantacao}x de R$ ${(proposta.valorImplantacao / (proposta.parcelasImplantacao || 1)).toFixed(2)}`;

  const itensHtml = proposta.itens.length > 0
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:${config.corTemaPDF}20;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">Descrição</th><th style="text-align:center;padding:8px;border:1px solid #ddd;">Qtd</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Valor</th></tr></thead>
        <tbody>${proposta.itens.map(i => `<tr><td style="padding:8px;border:1px solid #ddd;">${i.descricao}</td><td style="text-align:center;padding:8px;border:1px solid #ddd;">${i.quantidade}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">R$ ${i.valor.toFixed(2)}</td></tr>`).join("")}</tbody>
      </table>` : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Proposta ${proposta.numeroProposta}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:40px;color:#1a1a2e;line-height:1.6;}
  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid ${config.corTemaPDF};padding-bottom:20px;margin-bottom:30px;}
  .logo{font-size:24px;font-weight:700;color:${config.corTemaPDF};}
  .badge{background:${config.corTemaPDF};color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;}
  .section{margin-bottom:24px;}
  .section h3{color:${config.corTemaPDF};margin-bottom:8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .field{background:#f8f9fa;padding:12px;border-radius:8px;}
  .field label{font-size:11px;color:#666;display:block;margin-bottom:2px;}
  .field span{font-size:15px;font-weight:500;}
  .valor-destaque{font-size:28px;font-weight:700;color:${config.corTemaPDF};}
  .footer{margin-top:40px;padding-top:20px;border-top:2px solid #eee;font-size:11px;color:#999;text-align:center;}
  ${config.exibirAssinaturaDigitalFake ? `.assinatura{margin-top:40px;text-align:center;}.assinatura .linha{border-top:1px solid #ccc;width:250px;margin:0 auto;padding-top:8px;font-size:12px;color:#666;}` : ""}
</style></head><body>
<div class="header">
  <div><div class="logo">${config.nomeEmpresa}</div><div style="color:#666;font-size:12px;">Proposta Comercial</div></div>
  <div style="text-align:right;"><span class="badge">${proposta.numeroProposta}</span><div style="font-size:11px;color:#666;margin-top:4px;">${proposta.dataEnvio ? new Date(proposta.dataEnvio).toLocaleDateString("pt-BR") : "Rascunho"}</div></div>
</div>
<div class="section"><h3>Cliente</h3><div class="field"><label>Nome</label><span>${proposta.clienteNomeSnapshot || "Não definido"}</span></div></div>
<div class="section"><h3>Sistema / Plano</h3><div class="grid"><div class="field"><label>Sistema</label><span>${proposta.sistema}</span></div><div class="field"><label>Plano</label><span>${proposta.planoNome}</span></div></div></div>
<div class="section"><h3>Valores</h3><div class="grid">
  <div class="field"><label>Mensalidade</label><span class="valor-destaque">R$ ${proposta.valorMensalidade.toFixed(2)}<span style="font-size:14px;font-weight:400;color:#666;">/mês</span></span></div>
  <div class="field"><label>Implantação</label><span style="font-size:20px;font-weight:600;">R$ ${proposta.valorImplantacao.toFixed(2)}</span><div style="font-size:12px;color:#666;">${fluxo}</div></div>
</div></div>
${itensHtml}
${proposta.informacoesAdicionais ? `<div class="section"><h3>Informações Adicionais</h3><div class="field"><span>${proposta.informacoesAdicionais}</span></div></div>` : ""}
${proposta.dataValidade ? `<div class="section"><div class="field" style="background:${config.corTemaPDF}10;border:1px solid ${config.corTemaPDF}40;"><label>Validade da Proposta</label><span>Válida até ${new Date(proposta.dataValidade).toLocaleDateString("pt-BR")}</span></div></div>` : ""}
${config.exibirAssinaturaDigitalFake ? `<div class="assinatura"><div class="linha">${config.nomeEmpresa}<br/>Assinatura Digital</div></div>` : ""}
<div class="footer">${config.rodapePDF}</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${proposta.numeroProposta}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
