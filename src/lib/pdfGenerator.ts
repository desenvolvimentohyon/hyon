export interface PdfProposalData {
  proposalNumber: string;
  clientName: string;
  systemName: string;
  planName: string;
  monthlyValue: number;
  implementationValue: number;
  implementationFlow: string; // "a_vista" | "parcelado"
  implementationInstallments: number | null;
  sentAt: string | null;
  validUntil: string | null;
  additionalInfo: string | null;
  acceptedAt: string | null;
  acceptedByName: string | null;
  acceptanceStatus: string;
  items: { description: string; quantity: number; unitValue: number }[];
}

export interface PdfCompanyData {
  tradeName: string | null;
  legalName: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerText: string | null;
  institutionalText: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressUf: string | null;
  addressCep: string | null;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dateStr = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateProposalPDF(
  proposal: PdfProposalData,
  company: PdfCompanyData
) {
  const dark = "#0f172a";
  const darkCard = "#1e293b";
  const green = "#4ade80";
  const greenMuted = "#86efac";
  const greenDim = "rgba(74,222,128,0.15)";
  const greenBorder = "rgba(74,222,128,0.25)";
  const white = "#f1f5f9";
  const companyName = company.tradeName || company.legalName || "Hyon Tecnologia";
  const fileName = `proposta-${slugify(proposal.clientName || "cliente")}-${new Date().toISOString().slice(0, 10)}`;
  const year = new Date().getFullYear();

  const addressParts = [
    company.addressStreet,
    company.addressNumber,
    company.addressNeighborhood,
    company.addressCity,
    company.addressUf,
    company.addressCep,
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : null;

  const flowLabel =
    proposal.implementationFlow === "parcelado" &&
    proposal.implementationInstallments
      ? `${proposal.implementationInstallments}x de ${fmt(proposal.implementationValue / proposal.implementationInstallments)}`
      : "À vista";

  const itemsRows = proposal.items
    .map(
      (i) =>
        `<tr><td style="padding:12px 14px;border-bottom:1px solid ${greenBorder};">${i.description}</td><td style="padding:12px 14px;border-bottom:1px solid ${greenBorder};text-align:center;">${i.quantity}</td><td style="padding:12px 14px;border-bottom:1px solid ${greenBorder};text-align:right;">${fmt(i.unitValue)}</td><td style="padding:12px 14px;border-bottom:1px solid ${greenBorder};text-align:right;">${fmt(i.quantity * i.unitValue)}</td></tr>`
    )
    .join("");

  const itemsTable =
    proposal.items.length > 0
      ? `<div class="section" style="page-break-inside:avoid;">
          <h2>Itens da Proposta</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;color:${white};">
            <thead><tr style="background:${greenDim};">
              <th style="text-align:left;padding:12px 14px;border-bottom:2px solid ${green};color:${green};font-size:11px;text-transform:uppercase;letter-spacing:1px;">Descrição</th>
              <th style="text-align:center;padding:12px 14px;border-bottom:2px solid ${green};color:${green};font-size:11px;text-transform:uppercase;letter-spacing:1px;width:60px;">Qtd</th>
              <th style="text-align:right;padding:12px 14px;border-bottom:2px solid ${green};color:${green};font-size:11px;text-transform:uppercase;letter-spacing:1px;width:110px;">Valor Unit.</th>
              <th style="text-align:right;padding:12px 14px;border-bottom:2px solid ${green};color:${green};font-size:11px;text-transform:uppercase;letter-spacing:1px;width:110px;">Total</th>
            </tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>
        </div>`
      : "";

  const signatureBlock =
    proposal.acceptanceStatus === "aceitou"
      ? `<div class="section signature" style="page-break-inside:avoid;">
          <h2>Aceite</h2>
          <div style="background:${greenDim};border:1px solid ${green};border-radius:12px;padding:24px;text-align:center;">
            <p style="font-size:16px;font-weight:600;color:${green};">✓ Proposta aceita${proposal.acceptedByName ? ` por ${proposal.acceptedByName}` : ""}</p>
            <p style="font-size:13px;color:${greenMuted};margin-top:4px;">em ${dateStr(proposal.acceptedAt)}</p>
          </div>
        </div>`
      : `<div class="section signature" style="page-break-inside:avoid;">
          <h2>Aceite da Proposta</h2>
          <div style="margin-top:40px;">
            <div style="display:flex;gap:60px;flex-wrap:wrap;">
              <div style="flex:1;min-width:200px;">
                <div style="border-bottom:1px solid ${greenBorder};height:40px;"></div>
                <p style="font-size:12px;color:${greenMuted};margin-top:6px;">Nome do responsável</p>
              </div>
              <div style="flex:1;min-width:200px;">
                <div style="border-bottom:1px solid ${greenBorder};height:40px;"></div>
                <p style="font-size:12px;color:${greenMuted};margin-top:6px;">Data</p>
              </div>
            </div>
          </div>
        </div>`;

  const institutionalSection = company.institutionalText
    ? `<div class="section" style="page-break-inside:avoid;">
        <h2>Sobre o Sistema</h2>
        <p style="font-size:14px;line-height:1.7;color:${greenMuted};">${company.institutionalText}</p>
      </div>`
    : "";

  const logoHtml = company.logoUrl
    ? `<img src="${company.logoUrl}" style="max-height:70px;max-width:220px;object-fit:contain;" crossorigin="anonymous" />`
    : `<div style="width:56px;height:56px;border-radius:14px;background:${green};display:flex;align-items:center;justify-content:center;color:${dark};font-weight:700;font-size:24px;">${companyName.charAt(0)}</div>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${fileName}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: ${white}; line-height: 1.5; background: ${dark}; }
  
  .cover { min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 40px 0; page-break-after: always; background: ${dark}; }
  .cover-top { display: flex; justify-content: flex-start; align-items: flex-start; }
  .cover-center { text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 16px; }
  .cover-title { font-size: 42px; font-weight: 800; letter-spacing: 4px; color: #fff; text-transform: uppercase; }
  .cover-subtitle { font-size: 18px; color: ${green}; font-weight: 500; letter-spacing: 2px; }
  .cover-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 440px; margin: 28px auto 0; }
  .cover-meta-item { background: ${darkCard}; border: 1px solid ${greenBorder}; border-radius: 10px; padding: 14px 18px; text-align: left; }
  .cover-meta-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: ${green}; display: block; margin-bottom: 4px; }
  .cover-meta-item span { font-size: 14px; font-weight: 600; color: #fff; }
  .cover-bottom { font-size: 12px; color: ${greenMuted}; line-height: 1.7; }
  .cover-bottom strong { color: #fff; }

  .section { margin-bottom: 32px; }
  .section h2 { font-size: 15px; font-weight: 700; color: ${green}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${greenBorder}; }
  
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .summary-card { border: 1px solid ${greenBorder}; border-radius: 12px; padding: 20px; text-align: center; background: ${darkCard}; }
  .summary-card.highlight { border-color: ${green}; background: ${greenDim}; }
  .summary-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${green}; }
  .summary-value { font-size: 28px; font-weight: 800; margin: 4px 0; color: #fff; }
  .summary-sub { font-size: 12px; color: ${greenMuted}; }

  .benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .benefit-item { display: flex; align-items: flex-start; gap: 10px; padding: 14px; border-radius: 10px; background: ${darkCard}; border: 1px solid ${greenBorder}; }
  .benefit-icon { width: 28px; height: 28px; border-radius: 8px; background: ${greenDim}; color: ${green}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; font-weight: 700; }
  .benefit-text { font-size: 13px; font-weight: 600; color: ${white}; }
  
  .conditions-table { width: 100%; border-collapse: collapse; }
  .conditions-table th { text-align: left; padding: 12px 14px; background: ${greenDim}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${green}; border-bottom: 2px solid ${green}; }
  .conditions-table td { padding: 12px 14px; border-bottom: 1px solid ${greenBorder}; font-size: 14px; color: ${white}; }
  .conditions-table td:last-child { font-weight: 700; text-align: right; color: #fff; }
  
  .steps-list { counter-reset: step; }
  .step-item { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
  .step-num { width: 32px; height: 32px; border-radius: 50%; background: ${green}; color: ${dark}; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-title { font-size: 14px; font-weight: 600; color: #fff; }
  .step-desc { font-size: 12px; color: ${greenMuted}; }
  
  .footer-block { margin-top: 40px; padding-top: 20px; border-top: 2px solid ${greenBorder}; font-size: 11px; color: ${greenMuted}; text-align: center; line-height: 1.8; }
  .footer-block strong { color: ${green}; }
  
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
  }
  @media screen {
    body { max-width: 800px; margin: 0 auto; padding: 20px; }
    .cover { min-height: auto; padding: 60px 40px; border: 1px solid ${greenBorder}; margin-bottom: 20px; border-radius: 8px; }
    .page-content { border: 1px solid ${greenBorder}; border-radius: 8px; padding: 40px; background: ${dark}; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-top">
    <div>${logoHtml}</div>
  </div>
  <div class="cover-center">
    <div class="cover-title">${companyName.toUpperCase()}</div>
    <div style="width:80px;height:3px;background:${green};border-radius:2px;margin:8px auto;"></div>
    <div class="cover-subtitle">PROPOSTA COMERCIAL</div>
    <div class="cover-meta">
      <div class="cover-meta-item"><label>Cliente</label><span>${proposal.clientName || "—"}</span></div>
      <div class="cover-meta-item"><label>Proposta</label><span>${proposal.proposalNumber}</span></div>
      <div class="cover-meta-item"><label>Data</label><span>${dateStr(proposal.sentAt)}</span></div>
      <div class="cover-meta-item"><label>Validade</label><span>${dateStr(proposal.validUntil)}</span></div>
    </div>
  </div>
  <div class="cover-bottom">
    ${company.cnpj ? `<strong>CNPJ:</strong> ${company.cnpj}<br/>` : ""}
    ${company.phone ? `${company.phone}` : ""}${company.email ? ` | ${company.email}` : ""}<br/>
    ${fullAddress ? `${fullAddress}` : ""}
  </div>
</div>

<!-- CONTENT -->
<div class="page-content">

  <!-- Summary -->
  <div class="section">
    <h2>Resumo Comercial</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Sistema</div>
        <div style="font-size:18px;font-weight:700;margin-top:4px;color:#fff;">${proposal.systemName || "—"}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Plano</div>
        <div style="font-size:18px;font-weight:700;margin-top:4px;color:#fff;">${proposal.planName || "—"}</div>
      </div>
      <div class="summary-card highlight">
        <div class="summary-label">Mensalidade</div>
        <div class="summary-value" style="color:${green};">${fmt(proposal.monthlyValue)}</div>
        <div class="summary-sub">/mês</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Implantação</div>
        <div class="summary-value">${fmt(proposal.implementationValue)}</div>
        <div class="summary-sub">${flowLabel}</div>
      </div>
    </div>
  </div>

  <!-- Benefits -->
  <div class="section" style="page-break-inside:avoid;">
    <h2>O que está incluso</h2>
    <div class="benefits-grid">
      <div class="benefit-item"><div class="benefit-icon">✓</div><div><div class="benefit-text">Implantação assistida</div></div></div>
      <div class="benefit-item"><div class="benefit-icon">✓</div><div><div class="benefit-text">Treinamento da equipe</div></div></div>
      <div class="benefit-item"><div class="benefit-icon">✓</div><div><div class="benefit-text">Suporte técnico</div></div></div>
      <div class="benefit-item"><div class="benefit-icon">✓</div><div><div class="benefit-text">Config. de equipamentos</div></div></div>
      <div class="benefit-item"><div class="benefit-icon">✓</div><div><div class="benefit-text">Atualizações do sistema</div></div></div>
      <div class="benefit-item"><div class="benefit-icon">✓</div><div><div class="benefit-text">Acesso remoto</div></div></div>
    </div>
  </div>

  ${institutionalSection}

  ${itemsTable}

  <!-- Conditions -->
  <div class="section" style="page-break-inside:avoid;">
    <h2>Condições Comerciais</h2>
    <table class="conditions-table">
      <thead><tr><th>Item</th><th style="text-align:right;">Valor</th></tr></thead>
      <tbody>
        <tr><td>Implantação</td><td>${fmt(proposal.implementationValue)}</td></tr>
        <tr><td>Mensalidade</td><td>${fmt(proposal.monthlyValue)}</td></tr>
        <tr><td>Prazo de Validade</td><td style="font-weight:600;">${dateStr(proposal.validUntil)}</td></tr>
      </tbody>
    </table>
    <ul style="margin-top:16px;padding-left:20px;font-size:13px;color:${greenMuted};line-height:1.8;">
      <li>Mensalidade cobrada conforme plano escolhido</li>
      <li>Implantação inclui treinamento inicial</li>
      <li>Suporte conforme horário contratado</li>
      ${proposal.validUntil ? `<li>Esta proposta é válida até ${dateStr(proposal.validUntil)}</li>` : ""}
      ${proposal.additionalInfo ? `<li>${proposal.additionalInfo}</li>` : ""}
    </ul>
  </div>

  <!-- Steps -->
  <div class="section" style="page-break-inside:avoid;">
    <h2>Próximos Passos</h2>
    <div class="steps-list">
      <div class="step-item"><div class="step-num">1</div><div><div class="step-title">Aceite da proposta</div><div class="step-desc">Confirme o aceite para dar início ao processo</div></div></div>
      <div class="step-item"><div class="step-num">2</div><div><div class="step-title">Agendamento da implantação</div><div class="step-desc">Nossa equipe entrará em contato</div></div></div>
      <div class="step-item"><div class="step-num">3</div><div><div class="step-title">Treinamento da equipe</div><div class="step-desc">Capacitação para uso do sistema</div></div></div>
      <div class="step-item"><div class="step-num">4</div><div><div class="step-title">Início da operação</div><div class="step-desc">Sistema pronto para uso</div></div></div>
    </div>
  </div>

  ${signatureBlock}

  <!-- Footer -->
  <div class="footer-block">
    © ${year} <strong>${companyName}</strong> — Todos os direitos reservados
    ${company.cnpj ? `<br/>CNPJ: ${company.cnpj}` : ""}
    ${company.phone ? ` | ${company.phone}` : ""}
    ${company.email ? ` | ${company.email}` : ""}
    ${fullAddress ? `<br/>${fullAddress}` : ""}
  </div>

</div>

<script>
  window.onload = function() { setTimeout(function() { window.print(); }, 400); };
</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

// Legacy wrapper for internal use (PropostaDetalhe still uses old types)
import { Proposta, CRMConfig } from "@/types/propostas";
import { supabase } from "@/integrations/supabase/client";

export async function gerarPDFPropostaComDados(proposta: Proposta, orgId: string) {
  // Fetch company_profile from DB
  const { data: cp } = await supabase
    .from("company_profile")
    .select("trade_name, legal_name, cnpj, phone, email, website, whatsapp, logo_path, primary_color, secondary_color, footer_text, institutional_text, address_street, address_number, address_neighborhood, address_city, address_uf, address_cep")
    .eq("org_id", orgId)
    .maybeSingle();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const logoUrl = cp?.logo_path
    ? `${supabaseUrl}/storage/v1/object/public/company-logos/${cp.logo_path}`
    : null;

  generateProposalPDF(
    {
      proposalNumber: proposta.numeroProposta,
      clientName: proposta.clienteNomeSnapshot || "",
      systemName: proposta.sistema,
      planName: proposta.planoNome,
      monthlyValue: proposta.valorMensalidade,
      implementationValue: proposta.valorImplantacao,
      implementationFlow: proposta.fluxoPagamentoImplantacao,
      implementationInstallments: proposta.parcelasImplantacao,
      sentAt: proposta.dataEnvio,
      validUntil: proposta.dataValidade,
      additionalInfo: proposta.informacoesAdicionais,
      acceptedAt: null,
      acceptedByName: null,
      acceptanceStatus: proposta.statusAceite,
      items: proposta.itens.map((i) => ({
        description: i.descricao,
        quantity: i.quantidade,
        unitValue: i.valor,
      })),
    },
    {
      tradeName: cp?.trade_name || null,
      legalName: cp?.legal_name || null,
      cnpj: cp?.cnpj || null,
      phone: cp?.phone || null,
      email: cp?.email || null,
      website: cp?.website || null,
      whatsapp: cp?.whatsapp || null,
      logoUrl,
      primaryColor: cp?.primary_color || "#3b82f6",
      secondaryColor: cp?.secondary_color || "#10b981",
      footerText: cp?.footer_text || null,
      institutionalText: cp?.institutional_text || null,
      addressStreet: cp?.address_street || null,
      addressNumber: cp?.address_number || null,
      addressNeighborhood: cp?.address_neighborhood || null,
      addressCity: cp?.address_city || null,
      addressUf: cp?.address_uf || null,
      addressCep: cp?.address_cep || null,
    }
  );
}

/** @deprecated Use gerarPDFPropostaComDados instead */
export function gerarPDFProposta(proposta: Proposta, config: CRMConfig) {
  generateProposalPDF(
    {
      proposalNumber: proposta.numeroProposta,
      clientName: proposta.clienteNomeSnapshot || "",
      systemName: proposta.sistema,
      planName: proposta.planoNome,
      monthlyValue: proposta.valorMensalidade,
      implementationValue: proposta.valorImplantacao,
      implementationFlow: proposta.fluxoPagamentoImplantacao,
      implementationInstallments: proposta.parcelasImplantacao,
      sentAt: proposta.dataEnvio,
      validUntil: proposta.dataValidade,
      additionalInfo: proposta.informacoesAdicionais,
      acceptedAt: null,
      acceptedByName: null,
      acceptanceStatus: proposta.statusAceite,
      items: proposta.itens.map((i) => ({
        description: i.descricao,
        quantity: i.quantidade,
        unitValue: i.valor,
      })),
    },
    {
      tradeName: config.nomeEmpresa,
      legalName: null,
      cnpj: null,
      phone: null,
      email: null,
      website: null,
      whatsapp: null,
      logoUrl: null,
      primaryColor: config.corTemaPDF,
      secondaryColor: "#10b981",
      footerText: config.rodapePDF,
      institutionalText: null,
      addressStreet: null,
      addressNumber: null,
      addressNeighborhood: null,
      addressCity: null,
      addressUf: null,
      addressCep: null,
    }
  );
}
