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
  const primary = company.primaryColor || "#3b82f6";
  const hexToRgb = (hex: string) => {
    const h = hex.replace("#", "");
    return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
  };
  const rgb = hexToRgb(primary);
  const primaryLight = `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`;
  const primaryMuted = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;
  const textDark = "#1e293b";
  const textMuted = "#64748b";
  const border = "#e2e8f0";
  const bgCard = "#f8fafc";
  const companyName = company.tradeName || company.legalName || "Hyon Tecnologia";
  const fileName = `proposta-${slugify(proposal.clientName || "cliente")}-${new Date().toISOString().slice(0, 10)}`;
  const year = new Date().getFullYear();

  const addressParts = [
    company.addressStreet,
    company.addressNumber,
    company.addressNeighborhood,
    company.addressCity,
    company.addressUf,
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
        `<tr><td style="padding:6px 8px;border-bottom:1px solid ${border};">${i.description}</td><td style="padding:6px 8px;border-bottom:1px solid ${border};text-align:center;">${i.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid ${border};text-align:right;">${fmt(i.unitValue)}</td><td style="padding:6px 8px;border-bottom:1px solid ${border};text-align:right;font-weight:600;">${fmt(i.quantity * i.unitValue)}</td></tr>`
    )
    .join("");

  const itemsTable =
    proposal.items.length > 0
      ? `<div class="section">
          <div class="section-header"><div class="section-icon">📋</div><div class="section-title">ITENS DA PROPOSTA</div></div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;color:${textDark};">
            <thead><tr style="background:${primaryLight};">
              <th style="text-align:left;padding:6px 8px;border-bottom:2px solid ${primary};color:${primary};font-size:9px;text-transform:uppercase;letter-spacing:1px;">Descrição</th>
              <th style="text-align:center;padding:6px 8px;border-bottom:2px solid ${primary};color:${primary};font-size:9px;text-transform:uppercase;letter-spacing:1px;width:40px;">Qtd</th>
              <th style="text-align:right;padding:6px 8px;border-bottom:2px solid ${primary};color:${primary};font-size:9px;text-transform:uppercase;letter-spacing:1px;width:80px;">Valor Unit.</th>
              <th style="text-align:right;padding:6px 8px;border-bottom:2px solid ${primary};color:${primary};font-size:9px;text-transform:uppercase;letter-spacing:1px;width:80px;">Total</th>
            </tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>
        </div>`
      : "";

  const signatureBlock =
    proposal.acceptanceStatus === "aceitou"
      ? `<div class="section">
          <div class="section-header"><div class="section-icon">✅</div><div class="section-title">ACEITE</div></div>
          <div style="background:${primaryLight};border:2px solid ${primary};border-radius:8px;padding:14px;text-align:center;">
            <p style="font-size:13px;font-weight:700;color:${primary};">✓ Proposta aceita${proposal.acceptedByName ? ` por ${proposal.acceptedByName}` : ""}</p>
            <p style="font-size:10px;color:${textMuted};margin-top:4px;">em ${dateStr(proposal.acceptedAt)}</p>
          </div>
        </div>`
      : `<div class="section">
          <div class="section-header"><div class="section-icon">✍️</div><div class="section-title">ACEITE DA PROPOSTA</div></div>
          <div style="display:flex;gap:40px;flex-wrap:wrap;margin-top:8px;">
            <div style="flex:1;min-width:160px;">
              <div style="border-bottom:2px solid ${border};height:28px;"></div>
              <p style="font-size:9px;color:${textMuted};margin-top:4px;">Nome do responsável</p>
            </div>
            <div style="flex:1;min-width:160px;">
              <div style="border-bottom:2px solid ${border};height:28px;"></div>
              <p style="font-size:9px;color:${textMuted};margin-top:4px;">Data</p>
            </div>
          </div>
        </div>`;

  const aboutSystemText = proposal.systemDescription || company.institutionalText;
  const institutionalSection = aboutSystemText
    ? `<div class="section">
        <div class="section-header"><div class="section-icon">💡</div><div class="section-title">SOBRE O SISTEMA</div></div>
        <p style="font-size:10px;line-height:1.6;color:${textMuted};">${aboutSystemText}</p>
      </div>`
    : "";

  const logoHtml = company.logoUrl
    ? `<img src="${company.logoUrl}" style="max-height:32px;max-width:100px;object-fit:contain;" crossorigin="anonymous" />`
    : `<div style="width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;">${companyName.charAt(0)}</div>`;

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
  @page { size: A4; margin: 10mm 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: ${textDark}; line-height: 1.4; background: #fff; font-size: 11px; }
  
  .top-bar { background: ${primary}; color: #fff; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 0 0 8px 8px; }
  .top-bar-left { display: flex; align-items: center; gap: 10px; }
  .top-bar-name { font-size: 15px; font-weight: 700; letter-spacing: 0.5px; color: #fff; }
  .top-bar-right { text-align: right; font-size: 9px; color: rgba(255,255,255,0.85); line-height: 1.6; }
  
  .title-block { text-align: center; margin: 14px 0 10px; }
  .title-block h1 { font-size: 18px; font-weight: 800; color: ${textDark}; letter-spacing: 2px; text-transform: uppercase; }
  .title-meta { display: flex; justify-content: center; gap: 24px; margin-top: 6px; }
  .title-meta-item { font-size: 9px; color: ${textMuted}; }
  .title-meta-item strong { color: ${textDark}; font-weight: 700; }

  .section { margin-bottom: 10px; }
  .section-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 2px solid ${border}; }
  .section-icon { width: 20px; height: 20px; border-radius: 50%; background: ${primaryLight}; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
  .section-title { font-size: 10px; font-weight: 700; color: ${primary}; text-transform: uppercase; letter-spacing: 1px; }

  .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .data-card { background: ${bgCard}; border: 1px solid ${border}; border-radius: 6px; padding: 8px 10px; }
  .data-card label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: ${textMuted}; display: block; margin-bottom: 2px; }
  .data-card span { font-size: 11px; font-weight: 600; color: ${textDark}; }

  .system-badge { display: inline-flex; align-items: center; gap: 6px; background: ${textDark}; color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; }
  .plan-badge { display: inline-flex; align-items: center; gap: 6px; background: ${primaryLight}; color: ${primary}; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-left: 8px; }

  .modules-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
  .module-card { background: #fff; border: 1px solid ${border}; border-left: 3px solid ${primary}; border-radius: 4px; padding: 5px 8px; display: flex; align-items: center; gap: 5px; }
  .module-icon { color: ${primary}; font-size: 10px; flex-shrink: 0; }
  .module-name { font-size: 9px; font-weight: 600; color: ${textDark}; }

  .invest-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .invest-card { background: ${bgCard}; border: 1px solid ${border}; border-radius: 8px; padding: 12px; text-align: center; }
  .invest-card.highlight { background: ${primaryLight}; border-color: ${primary}; }
  .invest-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: ${textMuted}; margin-bottom: 4px; }
  .invest-value { font-size: 20px; font-weight: 800; color: ${primary}; }
  .invest-sub { font-size: 9px; color: ${textMuted}; margin-top: 2px; }

  .conditions-table { width: 100%; border-collapse: collapse; }
  .conditions-table th { text-align: left; padding: 5px 8px; background: ${primaryLight}; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: ${primary}; border-bottom: 2px solid ${primary}; }
  .conditions-table td { padding: 5px 8px; border-bottom: 1px solid ${border}; font-size: 10px; color: ${textDark}; }
  .conditions-table td:last-child { font-weight: 700; text-align: right; }

  .steps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .step-item { display: flex; align-items: center; gap: 6px; }
  .step-num { width: 18px; height: 18px; border-radius: 50%; background: ${primary}; color: #fff; font-weight: 700; font-size: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-text { font-size: 10px; font-weight: 600; color: ${textDark}; }

  .footer-block { margin-top: 12px; padding-top: 6px; border-top: 2px solid ${border}; font-size: 8px; color: ${textMuted}; text-align: center; line-height: 1.5; }
  .footer-block strong { color: ${primary}; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @media screen {
    body { max-width: 800px; margin: 0 auto; padding: 20px; }
  }
</style>
</head>
<body>

<!-- TOP BAR -->
<div class="top-bar">
  <div class="top-bar-left">
    ${logoHtml}
    <div class="top-bar-name">${companyName}</div>
  </div>
  <div class="top-bar-right">
    ${company.cnpj ? `CNPJ: ${company.cnpj}<br/>` : ""}
    ${company.phone ? `${company.phone}` : ""}${company.email ? ` · ${company.email}` : ""}<br/>
    ${fullAddress ? `${fullAddress}` : ""}
  </div>
</div>

<!-- TITLE -->
<div class="title-block">
  <h1>Proposta Comercial</h1>
  <div class="title-meta">
    <div class="title-meta-item">Nº <strong>${proposal.proposalNumber}</strong></div>
    <div class="title-meta-item">Data <strong>${dateStr(proposal.sentAt || proposal.createdAt)}</strong></div>
    <div class="title-meta-item">Validade <strong>${validityDisplay}</strong></div>
  </div>
</div>

<!-- CLIENT DATA -->
<div class="section">
  <div class="section-header"><div class="section-icon">👤</div><div class="section-title">DADOS DO CLIENTE</div></div>
  <div class="data-grid">
    <div class="data-card"><label>Empresa / Cliente</label><span>${proposal.clientName || "—"}</span></div>
    <div class="data-card"><label>Plano</label><span>${proposal.planName || "—"}</span></div>
  </div>
</div>

<!-- SYSTEM -->
<div class="section">
  <div class="section-header"><div class="section-icon">🖥️</div><div class="section-title">SISTEMA</div></div>
  <div style="display:flex;align-items:center;gap:8px;">
    <div class="system-badge">⚙ ${proposal.systemName || "—"}</div>
    <div class="plan-badge">📦 ${proposal.planName || "—"}</div>
  </div>
</div>

<!-- BENEFITS / MODULES -->
<div class="section">
  <div class="section-header"><div class="section-icon">📦</div><div class="section-title">MÓDULOS INCLUÍDOS</div></div>
  <div class="modules-grid">
    <div class="module-card"><div class="module-icon">✓</div><div class="module-name">Implantação assistida</div></div>
    <div class="module-card"><div class="module-icon">✓</div><div class="module-name">Treinamento da equipe</div></div>
    <div class="module-card"><div class="module-icon">✓</div><div class="module-name">Suporte técnico</div></div>
    <div class="module-card"><div class="module-icon">✓</div><div class="module-name">Config. equipamentos</div></div>
    <div class="module-card"><div class="module-icon">✓</div><div class="module-name">Atualizações</div></div>
    <div class="module-card"><div class="module-icon">✓</div><div class="module-name">Acesso remoto</div></div>
  </div>
</div>

${institutionalSection}

<!-- INVESTMENT -->
<div class="section">
  <div class="section-header"><div class="section-icon">💰</div><div class="section-title">INVESTIMENTO</div></div>
  <div class="invest-grid">
    <div class="invest-card highlight">
      <div class="invest-label">Mensalidade</div>
      <div class="invest-value">${fmt(proposal.monthlyValue)}</div>
      <div class="invest-sub">/mês</div>
    </div>
    <div class="invest-card">
      <div class="invest-label">Implantação</div>
      <div class="invest-value" style="color:${textDark};">${fmt(proposal.implementationValue)}</div>
      <div class="invest-sub">${flowLabel}</div>
    </div>
  </div>
</div>

${itemsTable}

<!-- Conditions -->
<div class="section">
  <div class="section-header"><div class="section-icon">📄</div><div class="section-title">CONDIÇÕES COMERCIAIS</div></div>
  <table class="conditions-table">
    <thead><tr><th>Item</th><th style="text-align:right;">Valor</th></tr></thead>
    <tbody>
      <tr><td>Implantação</td><td>${fmt(proposal.implementationValue)}</td></tr>
      <tr><td>Mensalidade</td><td>${fmt(proposal.monthlyValue)}</td></tr>
      <tr><td>Prazo de Validade</td><td>${validityDisplay}</td></tr>
    </tbody>
  </table>
  <ul style="margin-top:6px;padding-left:16px;font-size:9px;color:${textMuted};line-height:1.6;">
    <li>Mensalidade cobrada conforme plano escolhido</li>
    <li>Implantação inclui treinamento inicial</li>
    <li>Suporte conforme horário contratado</li>
    ${proposal.additionalInfo ? `<li>${proposal.additionalInfo}</li>` : ""}
  </ul>
</div>

<!-- Steps -->
<div class="section">
  <div class="section-header"><div class="section-icon">🚀</div><div class="section-title">PRÓXIMOS PASSOS</div></div>
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
