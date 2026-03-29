// ===== RBAC Types =====

export interface Permission {
  modulo: string;
  acao: string;
}

export const MODULOS_PERMISSOES: Record<string, { label: string; acoes: { id: string; label: string }[] }> = {
  clientes: {
    label: "Clientes",
    acoes: [
      { id: "clientes:visualizar", label: "Visualizar" },
      { id: "clientes:criar", label: "Criar" },
      { id: "clientes:editar", label: "Editar" },
      { id: "clientes:cancelar", label: "Cancelar / Excluir" },
    ],
  },
  propostas: {
    label: "Propostas",
    acoes: [
      { id: "propostas:visualizar", label: "Visualizar" },
      { id: "propostas:criar", label: "Criar" },
      { id: "propostas:editar", label: "Editar" },
      { id: "propostas:enviar", label: "Enviar" },
      { id: "propostas:baixar-pdf", label: "Baixar PDF" },
      { id: "propostas:aprovar", label: "Aprovar" },
    ],
  },
  financeiro: {
    label: "Financeiro",
    acoes: [
      { id: "financeiro:visualizar", label: "Visualizar" },
      { id: "financeiro:lancar", label: "Lançar" },
      { id: "financeiro:conciliar", label: "Conciliar" },
      { id: "financeiro:editar-plano-contas", label: "Editar Plano de Contas" },
      { id: "financeiro:relatorios", label: "Relatórios" },
    ],
  },
  tarefas: {
    label: "Tarefas",
    acoes: [
      { id: "tarefas:visualizar", label: "Visualizar" },
      { id: "tarefas:criar", label: "Criar" },
      { id: "tarefas:editar", label: "Editar" },
      { id: "tarefas:atribuir", label: "Atribuir" },
      { id: "tarefas:encerrar", label: "Encerrar" },
    ],
  },
  configuracoes: {
    label: "Configurações",
    acoes: [
      { id: "configuracoes:visualizar", label: "Visualizar" },
      { id: "configuracoes:editar", label: "Editar" },
    ],
  },
  usuarios: {
    label: "Usuários",
    acoes: [
      { id: "usuarios:visualizar", label: "Visualizar" },
      { id: "usuarios:criar", label: "Criar" },
      { id: "usuarios:editar", label: "Editar" },
      { id: "usuarios:desativar", label: "Desativar" },
    ],
  },
  cartoes: {
    label: "Cartões",
    acoes: [
      { id: "cartoes:visualizar", label: "Visualizar" },
      { id: "cartoes:criar", label: "Criar" },
      { id: "cartoes:editar", label: "Editar" },
    ],
  },
  desenvolvimento: {
    label: "Desenvolvimento",
    acoes: [
      { id: "desenvolvimento:visualizar", label: "Visualizar" },
      { id: "desenvolvimento:criar", label: "Criar" },
      { id: "desenvolvimento:editar", label: "Editar" },
      { id: "desenvolvimento:excluir", label: "Excluir" },
    ],
  },
};

export const ALL_PERMISSIONS = Object.values(MODULOS_PERMISSOES).flatMap(m => m.acoes.map(a => a.id));

export interface Role {
  id: string;
  nome: string;
  descricao: string;
  permissions: string[];
  sistema: boolean; // roles de sistema não podem ser excluídas
}

export interface AppUser {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  ativo: boolean;
  roleId: string;
  criadoEm: string;
  atualizadoEm: string;
}

// Mapeamento de permissões para rotas do sidebar
export const ROTA_PERMISSAO: Record<string, string> = {
  "/tarefas": "tarefas:visualizar",
  "/comercial": "propostas:visualizar",
  "/implantacao": "tarefas:visualizar",
  "/suporte": "tarefas:visualizar",
  "/propostas": "propostas:visualizar",
  "/crm": "propostas:visualizar",
  "/financeiro": "financeiro:visualizar",
  "/financeiro/contas-a-receber": "financeiro:visualizar",
  "/financeiro/contas-a-pagar": "financeiro:visualizar",
  "/financeiro/lancamentos": "financeiro:lancar",
  "/financeiro/plano-de-contas": "financeiro:editar-plano-contas",
  "/financeiro/conciliacao-bancaria": "financeiro:conciliar",
  "/financeiro/relatorios": "financeiro:relatorios",
  "/financeiro/configuracoes": "financeiro:visualizar",
  "/clientes": "clientes:visualizar",
  
  "/receita": "financeiro:visualizar",
  "/tecnicos": "configuracoes:visualizar",
  "/executivo": "financeiro:relatorios",
  "/configuracoes": "configuracoes:visualizar",
  "/cartoes": "cartoes:visualizar",
  "/cartoes/clientes": "cartoes:visualizar",
  "/cartoes/propostas": "cartoes:visualizar",
  "/cartoes/faturamento": "cartoes:visualizar",
  "/desenvolvimento": "desenvolvimento:visualizar",
};
