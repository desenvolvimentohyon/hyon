import { Proposta, CRMConfig, DEFAULT_CRM_CONFIG } from "@/types/propostas";

const now = new Date();
const day = (d: number) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
};
const past = (d: number) => day(-d);

function uid() { return Math.random().toString(36).slice(2, 11); }

const h = (acao: string, det: string, d: number) => ({ id: uid(), acao, detalhes: det, criadoEm: past(d) });

export const defaultCRMConfig: CRMConfig = { ...DEFAULT_CRM_CONFIG };

export const seedPropostas: Proposta[] = [
  // Rascunho
  {
    id: "prop1", numeroProposta: "PROP-2026-0001",
    clienteId: null, clienteNomeSnapshot: "",
    sistema: "HYON", planoNome: "Básico",
    valorMensalidade: 450, valorImplantacao: 1500,
    fluxoPagamentoImplantacao: "parcelado", parcelasImplantacao: 3,
    dataEnvio: null, validadeDias: 10, dataValidade: null,
    statusCRM: "Rascunho", statusVisualizacao: "nao_enviado", statusAceite: "pendente",
    linkAceite: "/aceite/PROP-2026-0001", pdfGeradoEm: null,
    observacoesInternas: "Aguardando definição do cliente",
    informacoesAdicionais: "Inclui módulo estoque e fiscal.",
    itens: [
      { id: uid(), descricao: "Licença Hyon Básico", quantidade: 1, valor: 450 },
      { id: uid(), descricao: "Implantação presencial", quantidade: 1, valor: 1500 },
    ],
    historico: [h("Criação", "Proposta criada", 5)],
    criadoEm: past(5), atualizadoEm: past(5),
  },
  // Enviadas
  {
    id: "prop2", numeroProposta: "PROP-2026-0002",
    clienteId: "c1", clienteNomeSnapshot: "Supermercado Bom Preço",
    sistema: "HYON", planoNome: "Completo",
    valorMensalidade: 890, valorImplantacao: 3500,
    fluxoPagamentoImplantacao: "parcelado", parcelasImplantacao: 5,
    dataEnvio: past(3), validadeDias: 10, dataValidade: day(7),
    statusCRM: "Enviada", statusVisualizacao: "enviado", statusAceite: "pendente",
    linkAceite: "/aceite/PROP-2026-0002", pdfGeradoEm: past(3),
    observacoesInternas: "Cliente antigo, boa chance de fechar",
    informacoesAdicionais: "Inclui TEF, estoque, fiscal e financeiro.",
    itens: [
      { id: uid(), descricao: "Licença Hyon Completo", quantidade: 1, valor: 890 },
      { id: uid(), descricao: "Implantação completa", quantidade: 1, valor: 3500 },
    ],
    historico: [h("Criação", "Proposta criada", 6), h("Envio", "Proposta enviada por WhatsApp", 3)],
    criadoEm: past(6), atualizadoEm: past(3),
  },
  {
    id: "prop3", numeroProposta: "PROP-2026-0003",
    clienteId: "c2", clienteNomeSnapshot: "Restaurante Sabor & Arte",
    sistema: "HYON", planoNome: "Premium",
    valorMensalidade: 1200, valorImplantacao: 5000,
    fluxoPagamentoImplantacao: "a_vista", parcelasImplantacao: null,
    dataEnvio: past(5), validadeDias: 7, dataValidade: day(2),
    statusCRM: "Enviada", statusVisualizacao: "enviado", statusAceite: "pendente",
    linkAceite: "/aceite/PROP-2026-0003", pdfGeradoEm: past(5),
    observacoesInternas: "",
    informacoesAdicionais: "Tudo incluso + integração delivery.",
    itens: [],
    historico: [h("Criação", "Proposta criada", 8), h("Envio", "Proposta enviada por e-mail", 5)],
    criadoEm: past(8), atualizadoEm: past(5),
  },
  {
    id: "prop4", numeroProposta: "PROP-2026-0004",
    clienteId: "c8", clienteNomeSnapshot: "Materiais ABC Construção",
    sistema: "HYON", planoNome: "Completo",
    valorMensalidade: 750, valorImplantacao: 2800,
    fluxoPagamentoImplantacao: "parcelado", parcelasImplantacao: 4,
    dataEnvio: past(2), validadeDias: 10, dataValidade: day(8),
    statusCRM: "Enviada", statusVisualizacao: "enviado", statusAceite: "pendente",
    linkAceite: "/aceite/PROP-2026-0004", pdfGeradoEm: past(2),
    observacoesInternas: "Urgente — cliente quer migrar rápido",
    informacoesAdicionais: "Módulos estoque + fiscal + financeiro.",
    itens: [],
    historico: [h("Criação", "Proposta criada", 4), h("Envio", "Proposta enviada por WhatsApp", 2)],
    criadoEm: past(4), atualizadoEm: past(2),
  },
  // Visualizadas
  {
    id: "prop5", numeroProposta: "PROP-2026-0005",
    clienteId: "c3", clienteNomeSnapshot: "Padaria Estrela Dourada",
    sistema: "HYON", planoNome: "Básico",
    valorMensalidade: 450, valorImplantacao: 1200,
    fluxoPagamentoImplantacao: "a_vista", parcelasImplantacao: null,
    dataEnvio: past(6), validadeDias: 10, dataValidade: day(4),
    statusCRM: "Visualizada", statusVisualizacao: "visualizado", statusAceite: "pendente",
    linkAceite: "/aceite/PROP-2026-0005", pdfGeradoEm: past(6),
    observacoesInternas: "Cliente visualizou mas não respondeu",
    informacoesAdicionais: "",
    itens: [],
    historico: [h("Criação", "Proposta criada", 9), h("Envio", "Enviada", 6), h("Visualização", "Cliente visualizou a proposta", 4)],
    criadoEm: past(9), atualizadoEm: past(4),
  },
  {
    id: "prop6", numeroProposta: "PROP-2026-0006",
    clienteId: "c6", clienteNomeSnapshot: "Farmácia Vida Plena",
    sistema: "HYON", planoNome: "Premium",
    valorMensalidade: 980, valorImplantacao: 4000,
    fluxoPagamentoImplantacao: "parcelado", parcelasImplantacao: 6,
    dataEnvio: past(4), validadeDias: 10, dataValidade: day(6),
    statusCRM: "Negociação", statusVisualizacao: "visualizado", statusAceite: "pendente",
    linkAceite: "/aceite/PROP-2026-0006", pdfGeradoEm: past(4),
    observacoesInternas: "Negociando desconto de 10%",
    informacoesAdicionais: "Premium com pagamento integrado.",
    itens: [],
    historico: [h("Criação", "Proposta criada", 7), h("Envio", "Enviada", 4), h("Visualização", "Visualizada", 3), h("Negociação", "Entrou em negociação", 2)],
    criadoEm: past(7), atualizadoEm: past(2),
  },
  // Não abriu
  {
    id: "prop7", numeroProposta: "PROP-2026-0007",
    clienteId: "c4", clienteNomeSnapshot: "Loja Central Modas",
    sistema: "LINKPRO", planoNome: "Padrão",
    valorMensalidade: 380, valorImplantacao: 1000,
    fluxoPagamentoImplantacao: "a_vista", parcelasImplantacao: null,
    dataEnvio: past(8), validadeDias: 7, dataValidade: past(1),
    statusCRM: "Enviada", statusVisualizacao: "nao_abriu", statusAceite: "pendente",
    linkAceite: "/aceite/PROP-2026-0007", pdfGeradoEm: past(8),
    observacoesInternas: "Cliente não respondeu, ligar novamente",
    informacoesAdicionais: "",
    itens: [],
    historico: [h("Criação", "Proposta criada", 10), h("Envio", "Enviada", 8)],
    criadoEm: past(10), atualizadoEm: past(8),
  },
  // Aceitas
  {
    id: "prop8", numeroProposta: "PROP-2026-0008",
    clienteId: "c5", clienteNomeSnapshot: "Auto Peças Nacional",
    sistema: "LINKPRO", planoNome: "Completo",
    valorMensalidade: 550, valorImplantacao: 2000,
    fluxoPagamentoImplantacao: "parcelado", parcelasImplantacao: 4,
    dataEnvio: past(15), validadeDias: 10, dataValidade: past(5),
    statusCRM: "Aceita", statusVisualizacao: "visualizado", statusAceite: "aceitou",
    linkAceite: "/aceite/PROP-2026-0008", pdfGeradoEm: past(15),
    observacoesInternas: "Fechado! Iniciar implantação.",
    informacoesAdicionais: "Estoque + fiscal + relatórios.",
    itens: [],
    historico: [h("Criação", "Criada", 18), h("Envio", "Enviada", 15), h("Visualização", "Visualizada", 13), h("Aceite", "Cliente aceitou a proposta", 10)],
    criadoEm: past(18), atualizadoEm: past(10),
  },
  {
    id: "prop9", numeroProposta: "PROP-2026-0009",
    clienteId: "c6", clienteNomeSnapshot: "Farmácia Vida Plena",
    sistema: "HYON", planoNome: "Completo",
    valorMensalidade: 750, valorImplantacao: 3000,
    fluxoPagamentoImplantacao: "parcelado", parcelasImplantacao: 3,
    dataEnvio: past(25), validadeDias: 10, dataValidade: past(15),
    statusCRM: "Aceita", statusVisualizacao: "visualizado", statusAceite: "aceitou",
    linkAceite: "/aceite/PROP-2026-0009", pdfGeradoEm: past(25),
    observacoesInternas: "Implantação já em andamento.",
    informacoesAdicionais: "",
    itens: [],
    historico: [h("Criação", "Criada", 30), h("Envio", "Enviada", 25), h("Aceite", "Aceita", 20)],
    criadoEm: past(30), atualizadoEm: past(20),
  },
  // Recusada
  {
    id: "prop10", numeroProposta: "PROP-2026-0010",
    clienteId: "c7", clienteNomeSnapshot: "Pet Shop Amigo Fiel",
    sistema: "LINKPRO", planoNome: "Básico",
    valorMensalidade: 290, valorImplantacao: 800,
    fluxoPagamentoImplantacao: "a_vista", parcelasImplantacao: null,
    dataEnvio: past(12), validadeDias: 7, dataValidade: past(5),
    statusCRM: "Recusada", statusVisualizacao: "visualizado", statusAceite: "recusou",
    linkAceite: "/aceite/PROP-2026-0010", pdfGeradoEm: past(12),
    observacoesInternas: "Cliente achou caro. Tentar novamente em 3 meses.",
    informacoesAdicionais: "",
    itens: [],
    historico: [h("Criação", "Criada", 15), h("Envio", "Enviada", 12), h("Visualização", "Visualizada", 10), h("Recusa", "Cliente recusou a proposta", 8)],
    criadoEm: past(15), atualizadoEm: past(8),
  },
];
