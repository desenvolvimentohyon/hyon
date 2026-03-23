// ===== Parâmetros do Sistema =====

export interface SistemaCatalogo {
  id: string;
  nome: string;
  descricao: string;
  valorCusto: number;
  valorVenda: number;
  ativo: boolean;
}

export interface ModuloCatalogo {
  id: string;
  nome: string;
  descricao: string;
  valorCusto: number;
  valorVenda: number;
  ativo: boolean;
  sistemaId?: string;
  isGlobal?: boolean;
}

export interface FormaPagamentoCatalogo {
  id: string;
  nome: string;
  ativo: boolean;
  observacao?: string;
}

export interface PlanoCatalogo {
  id: string;
  nomePlano: string;
  descontoPercentual: number;
  validadeMeses: number;
  ativo: boolean;
}
