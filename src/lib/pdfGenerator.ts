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
  createdAt: string;
  validityDays: number | null;
  systemDescription: string | null;
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
  const green = company.primaryColor || "#4ade80";
  // Derive muted/dim/border variants from primaryColor via hex→rgb
  const hexToRgb = (hex: string) => {
    const h = hex.replace("#", "");
    return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
  };
  const rgb = hexToRgb(green);
  const greenMuted = `rgba(${rgb.r},${rgb.g},${rgb.b},0.7)`;
  const greenDim = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;
  const greenBorder = `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)`;
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
        `<tr><td style="padding:4px 6px;border-bottom:1px solid ${greenBorder};">${i.description}</td><td style="padding:4px 6px;border-bottom:1px solid ${greenBorder};text-align:center;">${i.quantity}</td><td style="padding:4px 6px;border-bottom:1px solid ${greenBorder};text-align:right;">${fmt(i.unitValue)}</td><td style="padding:4px 6px;border-bottom:1px solid ${greenBorder};text-align:right;">${fmt(i.quantity * i.unitValue)}</td></tr>`
    )
    .join("");

  const itemsTable =
    proposal.items.length > 0
      ? `<div class="section">
          <h2>Itens da Proposta</h2>
          <table style="width:100%;border-collapse:collapse;font-size:11px;color:${white};">
            <thead><tr style="background:${greenDim};">
              <th style="text-align:left;padding:4px 6px;border-bottom:1px solid ${green};color:${green};font-size:9px;text-transform:uppercase;letter-spacing:1px;">Descrição</th>
              <th style="text-align:center;padding:4px 6px;border-bottom:1px solid ${green};color:${green};font-size:9px;text-transform:uppercase;letter-spacing:1px;width:40px;">Qtd</th>
              <th style="text-align:right;padding:4px 6px;border-bottom:1px solid ${green};color:${green};font-size:9px;text-transform:uppercase;letter-spacing:1px;width:80px;">Valor Unit.</th>
              <th style="text-align:right;padding:4px 6px;border-bottom:1px solid ${green};color:${green};font-size:9px;text-transform:uppercase;letter-spacing:1px;width:80px;">Total</th>
            </tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>
        </div>`
      : "";

  const signatureBlock =
    proposal.acceptanceStatus === "aceitou"
      ? `<div class="section">
          <h2>Aceite</h2>
          <div style="background:${greenDim};border:1px solid ${green};border-radius:8px;padding:12px;text-align:center;">
            <p style="font-size:13px;font-weight:600;color:${green};">✓ Proposta aceita${proposal.acceptedByName ? ` por ${proposal.acceptedByName}` : ""}</p>
            <p style="font-size:10px;color:${greenMuted};margin-top:2px;">em ${dateStr(proposal.acceptedAt)}</p>
          </div>
        </div>`
      : `<div class="section">
          <h2>Aceite da Proposta</h2>
          <div style="display:flex;gap:40px;flex-wrap:wrap;margin-top:10px;">
            <div style="flex:1;min-width:160px;">
              <div style="border-bottom:1px solid ${greenBorder};height:24px;"></div>
              <p style="font-size:9px;color:${greenMuted};margin-top:3px;">Nome do responsável</p>
            </div>
            <div style="flex:1;min-width:160px;">
              <div style="border-bottom:1px solid ${greenBorder};height:24px;"></div>
              <p style="font-size:9px;color:${greenMuted};margin-top:3px;">Data</p>
            </div>
          </div>
        </div>`;

  const aboutSystemText = proposal.systemDescription || company.institutionalText;
  const institutionalSection = aboutSystemText
    ? `<div class="section">
        <h2>Sobre o Sistema</h2>
        <p style="font-size:10px;line-height:1.5;color:${greenMuted};">${aboutSystemText}</p>
      </div>`
    : "";

  const logoHtml = company.logoUrl
    ? `<img src="${company.logoUrl}" style="max-height:36px;max-width:120px;object-fit:contain;" crossorigin="anonymous" />`
    : `<div style="width:32px;height:32px;border-radius:8px;background:${green};display:flex;align-items:center;justify-content:center;color:${dark};font-weight:700;font-size:14px;">${companyName.charAt(0)}</div>`;

  const validityDisplay = (() => {
    if (proposal.validUntil) return dateStr(proposal.validUntil);
    if (proposal.createdAt && proposal.validityDays) {
      const d = new Date(proposal.createdAt);
      d.setDate(d.getDate() + proposal.validityDays);
      return d.toLocaleDateString("pt-BR");
    }
    return "—";
  })();

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${fileName}</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: ${white}; line-height: 1.35; background: ${dark}; font-size: 11px; }
  
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 2px solid ${green}; margin-bottom: 10px; }
  .header-left { display: flex; align-items: center; gap: 8px; }
  .header-company-name { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: 1px; }
  .header-right { text-align: right; font-size: 9px; color: ${greenMuted}; line-height: 1.5; }
  .header-right strong { color: ${green}; }
  
  .meta-bar { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px; }
  .meta-item { background: ${darkCard}; border: 1px solid ${greenBorder}; border-radius: 5px; padding: 5px 8px; }
  .meta-item label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: ${green}; display: block; margin-bottom: 1px; }
  .meta-item span { font-size: 11px; font-weight: 600; color: #fff; }

  .section { margin-bottom: 10px; }
  .section h2 { font-size: 10px; font-weight: 700; color: ${green}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid ${greenBorder}; }
  
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; }
  .summary-card { border: 1px solid ${greenBorder}; border-radius: 6px; padding: 7px; text-align: center; background: ${darkCard}; }
  .summary-card.highlight { border-color: ${green}; background: ${greenDim}; }
  .summary-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: ${green}; }
  .summary-value { font-size: 15px; font-weight: 800; margin: 1px 0; color: #fff; }
  .summary-sub { font-size: 9px; color: ${greenMuted}; }

  .benefits-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
  .benefit-item { display: flex; align-items: center; gap: 4px; padding: 3px 5px; border-radius: 4px; background: ${darkCard}; border: 1px solid ${greenBorder}; }
  .benefit-icon { color: ${green}; font-size: 9px; font-weight: 700; flex-shrink: 0; }
  .benefit-text { font-size: 9px; font-weight: 600; color: ${white}; }
  
  .conditions-table { width: 100%; border-collapse: collapse; }
  .conditions-table th { text-align: left; padding: 3px 6px; background: ${greenDim}; font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: ${green}; border-bottom: 1px solid ${green}; }
  .conditions-table td { padding: 3px 6px; border-bottom: 1px solid ${greenBorder}; font-size: 10px; color: ${white}; }
  .conditions-table td:last-child { font-weight: 700; text-align: right; color: #fff; }
  
  .steps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .step-item { display: flex; align-items: center; gap: 5px; }
  .step-num { width: 16px; height: 16px; border-radius: 50%; background: ${green}; color: ${dark}; font-weight: 700; font-size: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-text { font-size: 9px; font-weight: 600; color: #fff; }
  .step-text span { font-weight: 400; color: ${greenMuted}; }
  
  .footer-block { margin-top: 10px; padding-top: 5px; border-top: 1px solid ${greenBorder}; font-size: 8px; color: ${greenMuted}; text-align: center; line-height: 1.4; }
  .footer-block strong { color: ${green}; }
  
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @media screen {
    body { max-width: 800px; margin: 0 auto; padding: 20px; }
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="header-left">
    ${logoHtml}
    <div class="header-company-name">${companyName}</div>
  </div>
  <div class="header-right">
    ${company.cnpj ? `<strong>CNPJ:</strong> ${company.cnpj}<br/>` : ""}
    ${company.phone ? `${company.phone}` : ""}${company.email ? ` | ${company.email}` : ""}${(company.phone || company.email) ? "<br/>" : ""}
    ${fullAddress ? `${fullAddress}` : ""}
  </div>
</div>

<!-- META BAR -->
<div class="meta-bar">
  <div class="meta-item"><label>Cliente</label><span>${proposal.clientName || "—"}</span></div>
  <div class="meta-item"><label>Proposta</label><span>${proposal.proposalNumber}</span></div>
  <div class="meta-item"><label>Data</label><span>${dateStr(proposal.sentAt || proposal.createdAt)}</span></div>
  <div class="meta-item"><label>Validade</label><span>${validityDisplay}</span></div>
</div>

<!-- Summary -->
<div class="section">
  <h2>Resumo Comercial</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">Sistema</div>
      <div style="font-size:12px;font-weight:700;margin-top:1px;color:#fff;">${proposal.systemName || "—"}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Plano</div>
      <div style="font-size:12px;font-weight:700;margin-top:1px;color:#fff;">${proposal.planName || "—"}</div>
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
<div class="section">
  <h2>O que está incluso</h2>
  <div class="benefits-grid">
    <div class="benefit-item"><div class="benefit-icon">✓</div><div class="benefit-text">Implantação assistida</div></div>
    <div class="benefit-item"><div class="benefit-icon">✓</div><div class="benefit-text">Treinamento da equipe</div></div>
    <div class="benefit-item"><div class="benefit-icon">✓</div><div class="benefit-text">Suporte técnico</div></div>
    <div class="benefit-item"><div class="benefit-icon">✓</div><div class="benefit-text">Config. equipamentos</div></div>
    <div class="benefit-item"><div class="benefit-icon">✓</div><div class="benefit-text">Atualizações</div></div>
    <div class="benefit-item"><div class="benefit-icon">✓</div><div class="benefit-text">Acesso remoto</div></div>
  </div>
</div>

${institutionalSection}

${itemsTable}

<!-- Conditions -->
<div class="section">
  <h2>Condições Comerciais</h2>
  <table class="conditions-table">
    <thead><tr><th>Item</th><th style="text-align:right;">Valor</th></tr></thead>
    <tbody>
      <tr><td>Implantação</td><td>${fmt(proposal.implementationValue)}</td></tr>
      <tr><td>Mensalidade</td><td>${fmt(proposal.monthlyValue)}</td></tr>
      <tr><td>Prazo de Validade</td><td style="font-weight:600;">${validityDisplay}</td></tr>
    </tbody>
  </table>
  <ul style="margin-top:4px;padding-left:14px;font-size:9px;color:${greenMuted};line-height:1.5;">
    <li>Mensalidade cobrada conforme plano escolhido</li>
    <li>Implantação inclui treinamento inicial</li>
    <li>Suporte conforme horário contratado</li>
    ${proposal.additionalInfo ? `<li>${proposal.additionalInfo}</li>` : ""}
  </ul>
</div>

<!-- Steps -->
<div class="section">
  <h2>Próximos Passos</h2>
  <div class="steps-grid">
    <div class="step-item"><div class="step-num">1</div><div class="step-text">Aceite da proposta</div></div>
    <div class="step-item"><div class="step-num">2</div><div class="step-text">Agendamento da implantação</div></div>
    <div class="step-item"><div class="step-num">3</div><div class="step-text">Treinamento da equipe</div></div>
    <div class="step-item"><div class="step-num">4</div><div class="step-text">Início da operação</div></div>
  </div>
</div>

${signatureBlock}

<!-- Footer -->
<div class="footer-block">
  © ${year} <strong>${companyName}</strong> — Todos os direitos reservados
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
  // Fetch company_profile and system description in parallel
  const [{ data: cp }, { data: systemData }] = await Promise.all([
    supabase
      .from("company_profile")
      .select("trade_name, legal_name, cnpj, phone, email, website, whatsapp, logo_path, primary_color, secondary_color, footer_text, institutional_text, address_street, address_number, address_neighborhood, address_city, address_uf, address_cep")
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("systems_catalog")
      .select("description")
      .eq("org_id", orgId)
      .eq("name", proposta.sistema)
      .maybeSingle(),
  ]);

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
      createdAt: proposta.criadoEm,
      validityDays: proposta.validadeDias,
      systemDescription: systemData?.description || null,
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
      createdAt: proposta.criadoEm,
      validityDays: proposta.validadeDias,
      systemDescription: null,
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
