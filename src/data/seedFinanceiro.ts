import {
  ContaBancaria, PlanoContas, TituloFinanceiro, MovimentoBancario, ConfigFinanceira,
  StatusTitulo, OrigemTitulo, FormaPagamento, TipoTitulo
} from "@/types/financeiro";
import { seedClientesReceita } from "./seedReceita";

const past = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().split("T")[0];
};
const competencia = (monthsAgo: number) => {
  const d = new Date(); d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

let _uid = 5000;
const uid = (prefix: string) => `${prefix}${_uid++}`;

// ===== Contas Bancárias =====
export const seedContasBancarias: ContaBancaria[] = [
  { id: "cb1", nome: "Conta Principal", banco: "Banco do Brasil", agencia: "1234-5", conta: "56789-0", tipoConta: "corrente", saldoInicial: 25000, ativo: true },
  { id: "cb2", nome: "Conta Reserva", banco: "Nubank", agencia: "0001", conta: "98765-4", tipoConta: "corrente", saldoInicial: 8500, ativo: true },
];

// ===== Plano de Contas =====
export const seedPlanoContas: PlanoContas[] = [
  // 1 - Receitas
  { id: "pc1", codigo: "1", nome: "Receitas", tipo: "receita", paiId: null, ativo: true },
  { id: "pc101", codigo: "1.01", nome: "Mensalidades", tipo: "receita", paiId: "pc1", ativo: true },
  { id: "pc102", codigo: "1.02", nome: "Implantação", tipo: "receita", paiId: "pc1", ativo: true },
  { id: "pc103", codigo: "1.03", nome: "Treinamentos", tipo: "receita", paiId: "pc1", ativo: true },
  { id: "pc104", codigo: "1.04", nome: "Serviços Avulsos", tipo: "receita", paiId: "pc1", ativo: true },
  // 2 - Custos / Repasses
  { id: "pc2", codigo: "2", nome: "Custos / Repasses", tipo: "custo", paiId: null, ativo: true },
  { id: "pc201", codigo: "2.01", nome: "Repasses PDV+", tipo: "repasse", paiId: "pc2", ativo: true },
  { id: "pc202", codigo: "2.02", nome: "Repasses LinkPro", tipo: "repasse", paiId: "pc2", ativo: true },
  { id: "pc203", codigo: "2.03", nome: "Repasses Torge", tipo: "repasse", paiId: "pc2", ativo: true },
  { id: "pc204", codigo: "2.04", nome: "Repasses Emissor Fiscal", tipo: "repasse", paiId: "pc2", ativo: true },
  { id: "pc205", codigo: "2.05", nome: "Repasses Hyon Hospede", tipo: "repasse", paiId: "pc2", ativo: true },
  // 3 - Despesas Operacionais
  { id: "pc3", codigo: "3", nome: "Despesas Operacionais", tipo: "despesa", paiId: null, ativo: true },
  { id: "pc301", codigo: "3.01", nome: "Contabilidade", tipo: "despesa", paiId: "pc3", ativo: true },
  { id: "pc302", codigo: "3.02", nome: "Telefonia / Internet", tipo: "despesa", paiId: "pc3", ativo: true },
  { id: "pc303", codigo: "3.03", nome: "Marketing", tipo: "despesa", paiId: "pc3", ativo: true },
  { id: "pc304", codigo: "3.04", nome: "Salários / Pró-labore", tipo: "despesa", paiId: "pc3", ativo: true },
  { id: "pc305", codigo: "3.05", nome: "Ferramentas e SaaS", tipo: "despesa", paiId: "pc3", ativo: true },
  // 4 - Impostos
  { id: "pc4", codigo: "4", nome: "Impostos", tipo: "imposto", paiId: null, ativo: true },
  { id: "pc401", codigo: "4.01", nome: "Simples Nacional", tipo: "imposto", paiId: "pc4", ativo: true },
  { id: "pc402", codigo: "4.02", nome: "ISS", tipo: "imposto", paiId: "pc4", ativo: true },
  // 5 - Investimentos
  { id: "pc5", codigo: "5", nome: "Investimentos", tipo: "investimento", paiId: null, ativo: true },
  { id: "pc501", codigo: "5.01", nome: "Equipamentos", tipo: "investimento", paiId: "pc5", ativo: true },
  { id: "pc502", codigo: "5.02", nome: "Capacitação", tipo: "investimento", paiId: "pc5", ativo: true },
];

// ===== Títulos Financeiros =====
const formas: FormaPagamento[] = ["pix", "boleto", "cartao", "transferencia"];
const fornecedores = ["Contabilidade Foco", "VIVO Telecom", "Google Ads", "AWS Cloud", "Franqueadora ERP", "Adobe Creative"];

function gerarTitulo(
  tipo: TipoTitulo, origem: OrigemTitulo, desc: string, valor: number, catId: string,
  mesesAtras: number, status: StatusTitulo, clienteId?: string, fornecedor?: string
): TituloFinanceiro {
  const venc = past(mesesAtras * 30 - 15 + Math.floor(Math.random() * 10));
  const emissao = past(mesesAtras * 30);
  return {
    id: uid("tf"),
    tipo, origem, descricao: desc,
    clienteId: clienteId || null,
    fornecedorNome: fornecedor || null,
    categoriaPlanoContasId: catId,
    competenciaMes: competencia(mesesAtras),
    dataEmissao: emissao,
    vencimento: venc,
    valorOriginal: valor,
    desconto: 0,
    juros: status === "vencido" ? Math.round(valor * 0.02 * 100) / 100 : 0,
    multa: status === "vencido" ? Math.round(valor * 0.02 * 100) / 100 : 0,
    status,
    formaPagamento: formas[Math.floor(Math.random() * formas.length)],
    contaBancariaId: Math.random() > 0.3 ? "cb1" : "cb2",
    anexosFake: [],
    observacoes: "",
    criadoEm: emissao,
    atualizadoEm: emissao,
  };
}

export const seedTitulos: TituloFinanceiro[] = [];

// Generate 12 months of monthly fee receivables for active clients
const activeClients = seedClientesReceita.filter(c => c.mensalidadeAtiva);
for (let m = 0; m < 12; m++) {
  activeClients.forEach(c => {
    const isPast = m > 0;
    const isOverdue = m === 1 && (c.statusCliente === "atraso" || c.statusCliente === "suspenso");
    const st: StatusTitulo = isOverdue ? "vencido" : isPast ? "pago" : "aberto";
    seedTitulos.push(gerarTitulo("receber", "mensalidade", `Mensalidade ${c.nome}`, c.valorMensalidade, "pc101", m, st, c.id));
  });
}

// Implantation revenue (one-time)
seedTitulos.push(gerarTitulo("receber", "implantacao", "Implantação Supermercado Bom Preço", 2500, "pc102", 8, "pago", "cr1"));
seedTitulos.push(gerarTitulo("receber", "implantacao", "Implantação Loja Central Modas", 3200, "pc102", 5, "pago", "cr13"));
seedTitulos.push(gerarTitulo("receber", "implantacao", "Implantação Farmácia Vida Plena", 1800, "pc102", 3, "pago", "cr16"));

// Training revenue
seedTitulos.push(gerarTitulo("receber", "treinamento", "Treinamento PDV+ Avançado", 800, "pc103", 2, "pago", "cr1"));
seedTitulos.push(gerarTitulo("receber", "treinamento", "Treinamento LinkPro Estoque", 600, "pc103", 1, "pago", "cr14"));

// Monthly system cost payables (repasses)
for (let m = 0; m < 12; m++) {
  const isPast = m > 0;
  seedTitulos.push(gerarTitulo("pagar", "repasse", "Repasse PDV+ mensal", 646.50, "pc201", m, isPast ? "pago" : "aberto", undefined, "Franqueadora PDV+"));
  seedTitulos.push(gerarTitulo("pagar", "repasse", "Repasse LinkPro mensal", 520.60, "pc202", m, isPast ? "pago" : "aberto", undefined, "Franqueadora LinkPro"));
  seedTitulos.push(gerarTitulo("pagar", "repasse", "Repasse Torge mensal", 159.30, "pc203", m, isPast ? "pago" : "aberto", undefined, "Franqueadora Torge"));
  seedTitulos.push(gerarTitulo("pagar", "repasse", "Repasse Emissor Fiscal", 39.80, "pc204", m, isPast ? "pago" : "aberto", undefined, "Franqueadora EF"));
  seedTitulos.push(gerarTitulo("pagar", "repasse", "Repasse Hyon Hospede", 3.20, "pc205", m, isPast ? "pago" : "aberto", undefined, "Franqueadora Hyon"));
}

// Operational expenses
for (let m = 0; m < 12; m++) {
  const isPast = m > 0;
  seedTitulos.push(gerarTitulo("pagar", "despesa_operacional", "Contabilidade mensal", 450, "pc301", m, isPast ? "pago" : "aberto", undefined, "Contabilidade Foco"));
  seedTitulos.push(gerarTitulo("pagar", "despesa_operacional", "Internet + Telefonia", 320, "pc302", m, isPast ? "pago" : "aberto", undefined, "VIVO Telecom"));
  seedTitulos.push(gerarTitulo("pagar", "despesa_operacional", "Google Ads", 500, "pc303", m, isPast ? "pago" : "aberto", undefined, "Google Ads"));
  seedTitulos.push(gerarTitulo("pagar", "despesa_operacional", "Pró-labore", 4500, "pc304", m, isPast ? "pago" : "aberto", undefined, "Sócio"));
  seedTitulos.push(gerarTitulo("pagar", "despesa_operacional", "Ferramentas SaaS", 280, "pc305", m, isPast ? "pago" : "aberto", undefined, "AWS/Vercel"));
}

// Taxes
for (let m = 1; m < 12; m++) {
  seedTitulos.push(gerarTitulo("pagar", "imposto", "Simples Nacional", 380, "pc401", m, "pago", undefined, "Receita Federal"));
}

// Commissions
seedTitulos.push(gerarTitulo("pagar", "comissao", "Comissão venda - Supermercado Bom Preço", 500, "pc304", 8, "pago", "cr1", "Vendedor João"));
seedTitulos.push(gerarTitulo("pagar", "comissao", "Comissão venda - Loja Central Modas", 640, "pc304", 5, "pago", "cr13", "Vendedor Maria"));

// ===== Movimentos Bancários =====
export const seedMovimentos: MovimentoBancario[] = [];
let movId = 1;

// Generate movements from paid titles
seedTitulos.filter(t => t.status === "pago").forEach(t => {
  const shouldConciliate = Math.random() > 0.15; // 85% conciliados
  seedMovimentos.push({
    id: `mov${movId++}`,
    contaBancariaId: t.contaBancariaId || "cb1",
    data: t.vencimento,
    descricao: t.descricao,
    valor: t.tipo === "receber" ? t.valorOriginal : -t.valorOriginal,
    tipo: t.tipo === "receber" ? "credito" : "debito",
    conciliado: shouldConciliate,
    tituloVinculadoId: shouldConciliate ? t.id : null,
    categoriaSugestao: null,
    criadoEm: t.vencimento,
  });
});

// Add some unmatched bank movements (deposits/fees) for conciliation testing
for (let i = 0; i < 8; i++) {
  const isCredit = i < 3;
  seedMovimentos.push({
    id: `mov${movId++}`,
    contaBancariaId: i % 2 === 0 ? "cb1" : "cb2",
    data: past(Math.floor(Math.random() * 60)),
    descricao: isCredit
      ? ["Depósito não identificado", "TED recebida", "Crédito avulso"][i % 3]
      : ["Tarifa bancária", "IOF", "Taxa de manutenção", "Estorno", "Débito automático"][i % 5],
    valor: isCredit ? Math.round((500 + Math.random() * 2000) * 100) / 100 : -Math.round((15 + Math.random() * 100) * 100) / 100,
    tipo: isCredit ? "credito" : "debito",
    conciliado: false,
    tituloVinculadoId: null,
    categoriaSugestao: isCredit ? "pc104" : "pc305",
    criadoEm: past(Math.floor(Math.random() * 60)),
  });
}

// ===== Config Financeira =====
export const seedConfigFinanceira: ConfigFinanceira = {
  diasAlerta: 7,
  diasSuspensao: 30,
  contaBancariaPadraoId: "cb1",
  periodoPadraoRelatorio: "12m",
  custoPorSistema: {
    "PDV+": 53.88,
    "LinkPro": 57.84,
    "Torge": 31.86,
    "Emissor Fiscal": 13.27,
    "Hyon Hospede": 1.07,
  },
};
