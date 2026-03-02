import { Cliente, Tecnico, Tarefa } from "@/types";

const now = new Date();
const day = (d: number) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
};
const past = (d: number) => day(-d);

export const seedClientes: Cliente[] = [
  { id: "c1", nome: "Construtora Nova Era", telefone: "(11) 3456-7890", email: "contato@novaera.com.br", documento: "12.345.678/0001-90", criadoEm: past(60) },
  { id: "c2", nome: "Escritório Almeida & Costa", telefone: "(21) 2345-6789", email: "adm@almeidacosta.adv.br", documento: "23.456.789/0001-01", criadoEm: past(45) },
  { id: "c3", nome: "Padaria Estrela Dourada", telefone: "(11) 98765-4321", email: "estrela@gmail.com", criadoEm: past(30) },
  { id: "c4", nome: "Clínica Saúde Integral", telefone: "(31) 3333-4444", email: "ti@saudeintegral.com.br", documento: "34.567.890/0001-12", criadoEm: past(20) },
  { id: "c5", nome: "Escola Futuro Brilhante", telefone: "(11) 2222-3333", email: "direcao@futurobrilhante.edu.br", criadoEm: past(15) },
  { id: "c6", nome: "Auto Peças Central", telefone: "(19) 4444-5555", email: "compras@autopecascentral.com", documento: "45.678.901/0001-23", criadoEm: past(10) },
];

export const seedTecnicos: Tecnico[] = [
  { id: "t1", nome: "Carlos Silva", telefone: "(11) 99999-1111", email: "carlos@empresa.com", ativo: true },
  { id: "t2", nome: "Ana Oliveira", telefone: "(11) 99999-2222", email: "ana@empresa.com", ativo: true },
  { id: "t3", nome: "Pedro Santos", telefone: "(11) 99999-3333", email: "pedro@empresa.com", ativo: true },
  { id: "t4", nome: "Mariana Costa", telefone: "(11) 99999-4444", email: "mariana@empresa.com", ativo: false },
];

export const seedTarefas: Tarefa[] = [
  {
    id: "tar1", titulo: "Instalar rede de computadores", descricao: "Instalação completa da rede cabeada e Wi-Fi no novo escritório.",
    clienteId: "c1", responsavelId: "t1", prioridade: "alta", status: "em_andamento",
    prazoDataHora: day(2), criadoEm: past(5), atualizadoEm: past(1),
    tags: ["rede", "infraestrutura"], checklist: [
      { id: "ck1", texto: "Passar cabos", concluido: true },
      { id: "ck2", texto: "Configurar switch", concluido: true },
      { id: "ck3", texto: "Configurar Wi-Fi", concluido: false },
      { id: "ck4", texto: "Testar conexões", concluido: false },
    ],
    anexosFake: [{ id: "a1", nomeArquivo: "planta_rede.pdf", tipo: "PDF", tamanho: "2.3 MB" }],
    comentarios: [{ id: "cm1", autorNome: "Carlos Silva", texto: "Cabos passados com sucesso. Falta configurar.", criadoEm: past(2) }],
    historico: [
      { id: "h1", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(5) },
      { id: "h2", acao: "Status alterado", detalhes: "a_fazer → em_andamento", criadoEm: past(3) },
    ],
    tempoTotalSegundos: 7200, timerRodando: false,
  },
  {
    id: "tar2", titulo: "Manutenção servidor email", descricao: "Verificar e corrigir problemas de envio de email do servidor.",
    clienteId: "c2", responsavelId: "t2", prioridade: "urgente", status: "a_fazer",
    prazoDataHora: past(1), criadoEm: past(3), atualizadoEm: past(1),
    tags: ["email", "servidor"], checklist: [],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h3", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(3) }],
    tempoTotalSegundos: 0, timerRodando: false,
  },
  {
    id: "tar3", titulo: "Trocar impressora do RH", descricao: "Substituir impressora antiga por nova multifuncional.",
    clienteId: "c2", responsavelId: "t1", prioridade: "baixa", status: "concluida",
    criadoEm: past(15), atualizadoEm: past(7),
    tags: ["hardware"], checklist: [{ id: "ck5", texto: "Instalar drivers", concluido: true }],
    anexosFake: [], comentarios: [],
    historico: [
      { id: "h4", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(15) },
      { id: "h5", acao: "Concluída", detalhes: "Tarefa marcada como concluída", criadoEm: past(7) },
    ],
    tempoTotalSegundos: 3600, timerRodando: false,
  },
  {
    id: "tar4", titulo: "Configurar backup automático", descricao: "Implementar rotina de backup diário para o servidor principal.",
    clienteId: "c4", responsavelId: "t3", prioridade: "alta", status: "aguardando_cliente",
    prazoDataHora: day(5), criadoEm: past(10), atualizadoEm: past(2),
    tags: ["backup", "servidor"], checklist: [
      { id: "ck6", texto: "Definir política de backup", concluido: true },
      { id: "ck7", texto: "Configurar agente", concluido: false },
    ],
    anexosFake: [], comentarios: [{ id: "cm2", autorNome: "Pedro Santos", texto: "Aguardando credenciais do cliente.", criadoEm: past(2) }],
    historico: [{ id: "h6", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(10) }],
    tempoTotalSegundos: 1800, timerRodando: false,
  },
  {
    id: "tar5", titulo: "Atualizar antivírus", descricao: "Atualizar licenças e definições de antivírus em todas as estações.",
    clienteId: "c3", responsavelId: "t2", prioridade: "media", status: "a_fazer",
    prazoDataHora: day(3), criadoEm: past(4), atualizadoEm: past(4),
    tags: ["segurança"], checklist: [],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h7", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(4) }],
    tempoTotalSegundos: 0, timerRodando: false,
  },
  {
    id: "tar6", titulo: "Formatar notebook diretor", descricao: "Formatação e reinstalação do SO no notebook do diretor.",
    clienteId: "c5", responsavelId: "t1", prioridade: "media", status: "backlog",
    criadoEm: past(2), atualizadoEm: past(2),
    tags: ["hardware", "formatação"], checklist: [],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h8", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(2) }],
    tempoTotalSegundos: 0, timerRodando: false,
  },
  {
    id: "tar7", titulo: "Criar relatório de ativos", descricao: "Levantar todos os ativos de TI da empresa.",
    clienteId: null, responsavelId: "t2", prioridade: "baixa", status: "a_fazer",
    prazoDataHora: day(10), criadoEm: past(1), atualizadoEm: past(1),
    tags: ["inventário", "relatório"], checklist: [],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h9", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(1) }],
    tempoTotalSegundos: 0, timerRodando: false,
  },
  {
    id: "tar8", titulo: "Configurar VPN", descricao: "Configurar acesso VPN para trabalho remoto dos funcionários.",
    clienteId: "c1", responsavelId: "t3", prioridade: "alta", status: "em_andamento",
    prazoDataHora: day(1), criadoEm: past(7), atualizadoEm: past(1),
    tags: ["rede", "vpn"], checklist: [
      { id: "ck8", texto: "Instalar servidor VPN", concluido: true },
      { id: "ck9", texto: "Configurar certificados", concluido: true },
      { id: "ck10", texto: "Testar com usuários", concluido: false },
    ],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h10", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(7) }],
    tempoTotalSegundos: 5400, timerRodando: false,
  },
  {
    id: "tar9", titulo: "Migrar domínio de email", descricao: "Migrar domínio de email corporativo para novo provedor.",
    clienteId: "c6", responsavelId: "t1", prioridade: "urgente", status: "em_andamento",
    prazoDataHora: day(0), criadoEm: past(8), atualizadoEm: past(0),
    tags: ["email", "migração"], checklist: [],
    anexosFake: [], comentarios: [{ id: "cm3", autorNome: "Carlos Silva", texto: "Migração iniciada. 60% concluída.", criadoEm: past(0) }],
    historico: [{ id: "h11", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(8) }],
    tempoTotalSegundos: 10800, timerRodando: false,
  },
  {
    id: "tar10", titulo: "Instalar câmeras de segurança", descricao: "Instalar sistema de CFTV com 8 câmeras.",
    clienteId: "c3", responsavelId: "t3", prioridade: "media", status: "backlog",
    prazoDataHora: day(15), criadoEm: past(3), atualizadoEm: past(3),
    tags: ["segurança", "cftv"], checklist: [],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h12", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(3) }],
    tempoTotalSegundos: 0, timerRodando: false,
  },
  {
    id: "tar11", titulo: "Desenvolver planilha de controle", descricao: "Criar planilha de controle financeiro no Excel.",
    clienteId: null, responsavelId: "t2", prioridade: "baixa", status: "concluida",
    criadoEm: past(20), atualizadoEm: past(12),
    tags: ["relatório"], checklist: [],
    anexosFake: [{ id: "a2", nomeArquivo: "controle_financeiro.xlsx", tipo: "Excel", tamanho: "456 KB" }],
    comentarios: [],
    historico: [{ id: "h13", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(20) }],
    tempoTotalSegundos: 5400, timerRodando: false,
  },
  {
    id: "tar12", titulo: "Trocar switch do andar 2", descricao: "Switch apresentando falhas intermitentes.",
    clienteId: "c4", responsavelId: "t1", prioridade: "alta", status: "a_fazer",
    prazoDataHora: past(2), criadoEm: past(6), atualizadoEm: past(3),
    tags: ["rede", "hardware"], checklist: [],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h14", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(6) }],
    tempoTotalSegundos: 0, timerRodando: false,
  },
  {
    id: "tar13", titulo: "Configurar novo notebook", descricao: "Preparar notebook novo para o setor comercial.",
    clienteId: "c5", responsavelId: "t2", prioridade: "media", status: "a_fazer",
    prazoDataHora: day(4), criadoEm: past(1), atualizadoEm: past(1),
    tags: ["hardware", "setup"], checklist: [
      { id: "ck11", texto: "Instalar Windows", concluido: false },
      { id: "ck12", texto: "Instalar Office", concluido: false },
      { id: "ck13", texto: "Configurar email", concluido: false },
    ],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h15", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(1) }],
    tempoTotalSegundos: 0, timerRodando: false,
  },
  {
    id: "tar14", titulo: "Documentar procedimentos de TI", descricao: "Criar documentação dos procedimentos internos.",
    clienteId: null, responsavelId: "t3", prioridade: "baixa", status: "backlog",
    criadoEm: past(1), atualizadoEm: past(1),
    tags: ["documentação"], checklist: [],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h16", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(1) }],
    tempoTotalSegundos: 0, timerRodando: false,
  },
  {
    id: "tar15", titulo: "Verificar licenças de software", descricao: "Auditoria de todas as licenças de software ativas.",
    clienteId: null, responsavelId: "t1", prioridade: "media", status: "cancelada",
    criadoEm: past(25), atualizadoEm: past(18),
    tags: ["licenças", "auditoria"], checklist: [],
    anexosFake: [], comentarios: [],
    historico: [
      { id: "h17", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(25) },
      { id: "h18", acao: "Cancelada", detalhes: "Cancelada por mudança de prioridades", criadoEm: past(18) },
    ],
    tempoTotalSegundos: 900, timerRodando: false,
  },
  {
    id: "tar16", titulo: "Reparar estação do recepcionista", descricao: "PC travando frequentemente, verificar hardware.",
    clienteId: "c6", responsavelId: "t3", prioridade: "alta", status: "concluida",
    criadoEm: past(12), atualizadoEm: past(8),
    tags: ["hardware", "reparo"], checklist: [],
    anexosFake: [], comentarios: [{ id: "cm4", autorNome: "Pedro Santos", texto: "Problema era memória RAM defeituosa. Substituída.", criadoEm: past(8) }],
    historico: [{ id: "h19", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(12) }],
    tempoTotalSegundos: 4500, timerRodando: false,
  },
  {
    id: "tar17", titulo: "Instalar sistema de ponto", descricao: "Instalar e configurar sistema de controle de ponto eletrônico.",
    clienteId: "c1", responsavelId: "t2", prioridade: "media", status: "aguardando_cliente",
    prazoDataHora: day(7), criadoEm: past(5), atualizadoEm: past(2),
    tags: ["sistema", "ponto"], checklist: [],
    anexosFake: [], comentarios: [{ id: "cm5", autorNome: "Ana Oliveira", texto: "Aguardando definição do modelo pelo cliente.", criadoEm: past(2) }],
    historico: [{ id: "h20", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(5) }],
    tempoTotalSegundos: 1200, timerRodando: false,
  },
  {
    id: "tar18", titulo: "Limpar e organizar rack", descricao: "Organizar cabeamento e limpar rack do servidor.",
    clienteId: "c4", responsavelId: "t1", prioridade: "baixa", status: "a_fazer",
    prazoDataHora: day(12), criadoEm: past(1), atualizadoEm: past(1),
    tags: ["infraestrutura", "organização"], checklist: [],
    anexosFake: [], comentarios: [],
    historico: [{ id: "h21", acao: "Criação", detalhes: "Tarefa criada", criadoEm: past(1) }],
    tempoTotalSegundos: 0, timerRodando: false,
  },
];
