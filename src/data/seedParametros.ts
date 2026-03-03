import { SistemaCatalogo, ModuloCatalogo, FormaPagamentoCatalogo, PlanoCatalogo } from "@/types/parametros";

export const seedSistemas: SistemaCatalogo[] = [
  { id: "sys-hyon", nome: "Hyon Alimentação", descricao: "Sistema para food service e alimentação", valorCusto: 89, valorVenda: 199, ativo: true },
  { id: "sys-linkpro", nome: "LinkPro Varejo", descricao: "Sistema para varejo e PDV", valorCusto: 120, valorVenda: 279, ativo: true },
  { id: "sys-linkpro-lite", nome: "LinkPro Lite", descricao: "Versão simplificada para MEI", valorCusto: 45, valorVenda: 99, ativo: true },
];

export const seedModulos: ModuloCatalogo[] = [
  { id: "mod-estoque", nome: "Estoque", descricao: "Controle de estoque e inventário", valorCusto: 20, valorVenda: 49, ativo: true, sistemaId: "sys-hyon" },
  { id: "mod-fiscal", nome: "Fiscal / NF-e", descricao: "Emissão de notas fiscais", valorCusto: 30, valorVenda: 69, ativo: true, sistemaId: "sys-hyon" },
  { id: "mod-financeiro", nome: "Financeiro", descricao: "Controle financeiro integrado", valorCusto: 25, valorVenda: 59, ativo: true },
  { id: "mod-relatorios", nome: "Relatórios", descricao: "Relatórios gerenciais avançados", valorCusto: 15, valorVenda: 39, ativo: true },
  { id: "mod-tef", nome: "TEF", descricao: "Transferência eletrônica de fundos", valorCusto: 35, valorVenda: 79, ativo: true },
];

export const seedFormasPagamento: FormaPagamentoCatalogo[] = [
  { id: "fp-pix", nome: "PIX", ativo: true },
  { id: "fp-boleto", nome: "Boleto Bancário", ativo: true },
  { id: "fp-cartao", nome: "Cartão de Crédito", ativo: true, observacao: "Até 12x" },
  { id: "fp-transferencia", nome: "Transferência Bancária", ativo: true },
  { id: "fp-dinheiro", nome: "Dinheiro", ativo: true },
];

export const seedPlanos: PlanoCatalogo[] = [
  { id: "plan-mensal", nomePlano: "Mensal", descontoPercentual: 0, validadeMeses: 1, ativo: true },
  { id: "plan-trimestral", nomePlano: "Trimestral", descontoPercentual: 5, validadeMeses: 3, ativo: true },
  { id: "plan-semestral", nomePlano: "Semestral", descontoPercentual: 10, validadeMeses: 6, ativo: true },
  { id: "plan-anual", nomePlano: "Anual", descontoPercentual: 15, validadeMeses: 12, ativo: true },
];
