export interface ChangelogEntry {
  version: string;
  date: string; // ISO
  changes: { type: "novo" | "melhoria" | "correcao"; text: string }[];
}

// Ordem: mais recente primeiro. Ao subir uma nova versão, adicione no topo.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.7.2",
    date: "2026-08-05",
    changes: [
      { type: "melhoria", text: "Retry Inteligente: Implementado algoritmo de backoff exponencial para reconexão automática do assistente de IA." },
      { type: "melhoria", text: "Cobertura E2E de Voz: Testes automatizados expandidos para validar o fluxo de reconhecimento de fala e resiliência da UI." },
      { type: "novo", text: "Comando de Voz integrado: Agora você pode interagir com a Hyon IA via reconhecimento de fala (pt-BR)." },
      { type: "novo", text: "Motor Analítico IA: Implementadas RPCs de alto desempenho para cálculo de MRR, Churn Rate e resumos dinâmicos." },
      { type: "melhoria", text: "Auditoria completa da IA Hyon: Validado fluxo de chamadas via Edge Function e integridade dos prompts de métricas." },
      { type: "correcao", text: "Monitoramento de logs de navegação ativo para prevenir erros 404 intermitentes causados por cache de roteamento." },
      { type: "melhoria", text: "Otimização profunda em toda a aplicação com foco em performance, fluidez e UX." },
      { type: "melhoria", text: "Implementar melhorias de performance técnica (Lazy Loading, Code Splitting)." },
      { type: "melhoria", text: "Validar as métricas de Core Web Vitals após as otimizações profundas." },
      { type: "melhoria", text: "Executar uma auditoria com Lighthouse e registrar um baseline de LCP, FID e CLS para comparar depois das otimizações." },
      { type: "melhoria", text: "Otimizar o carregamento de fontes críticas com preload e fallback para reduzir o tempo de renderização inicial." },
      { type: "melhoria", text: "Implementar as tags de preload para a fonte Space Grotesk no index.html para melhorar o LCP." },
      { type: "melhoria", text: "Edite o arquivo index.html para incluir as tags de preload da fonte Space Grotesk e garantir melhor prioridade de carregamento." },
      { type: "novo", text: "Assistente de IA Hyon integrado para análise de métricas em tempo real." },
      { type: "novo", text: "Criar as RPCs de banco de dados (calculate_mrr, calculate_churn) para alimentar a IA com dados reais." },
      { type: "novo", text: "Quero que a IA do sistema consiga preencher contratos e enviar para os clientes." },
      { type: "novo", text: "Implemente um editor de templates de contrato com campos variáveis para clientes, técnicos e tarefas." },
      { type: "melhoria", text: "Adicione uma pré-visualização do contrato preenchido pela IA antes de finalizar o envio para eu revisar o conteúdo." },
      { type: "novo", text: "Crie uma fila de “envios simulados” com status, histórico e opção de reenviar para eu validar o fluxo sem backend." },
      { type: "novo", text: "Aba de Metas inteligente integrada ao Radar de Crescimento." },
      { type: "melhoria", text: "Atalho 'Metas e Crescimento' adicionado ao Dashboard principal." },
      { type: "melhoria", text: "Acompanhamento de progresso de MRR e Clientes Ativos por sistema." },
      { type: "melhoria", text: "Implementar o componente de CommandPalette real usando cmdk para navegação rápida por todo o sistema." },
      { type: "melhoria", text: "Mapear as rotas dinâmicas de clientes e tarefas específicas para que elas apareçam no CommandPalette ao buscar." },
      { type: "melhoria", text: "Validar a acessibilidade do CommandPalette com navegação 100% via teclado (Tab, Enter, Esc) e foco correto no modal." },
      { type: "melhoria", text: "Conectar a busca do CommandPalette ao meu estado local e ao localStorage para listar clientes e tarefas dinamicamente." },
      { type: "melhoria", text: "Implementar a sincronização em tempo real do CommandMenu com meus dados em localStorage para que criar, editar e excluir clientes e tarefas atualizem os resultados instantaneamente." },
      { type: "melhoria", text: "Implementar la invalidação de queries do TanStack Query no CommandMenu para que a busca reflita imediatamente criações, edições e exclusões de clientes e tarefas no localStorage." },
      { type: "melhoria", text: "Validar a performance da busca dinâmica com grandes volumes de dados locais." },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-07-24",
    changes: [
      { type: "novo", text: "Precificação de implantação por sistema (override de KM, diária e taxa fixa)." },
      { type: "melhoria", text: "Checkout Interno e Proposta Inteligente usam o motor unificado de setup." },
      { type: "melhoria", text: "PlanBuilder da landing exibe implantação estimada por sistema selecionado." },
      { type: "melhoria", text: "Reuniões integradas ao Google Calendar com lembretes push." },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-07-08",
    changes: [
      { type: "novo", text: "Histórico de versões acessível pelo ícone no topo." },
      { type: "melhoria", text: "Refinamento minimalista global (sombras, bordas, tipografia)." },
      { type: "correcao", text: "Cadastro de usuários agora conclui o convite corretamente." },
      { type: "correcao", text: "Removido auto-reload que descartava formulários em edição." },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-07-01",
    changes: [
      { type: "melhoria", text: "Wave 1 de UI: contraste, hover states e microinterações." },
      { type: "melhoria", text: "Marca d'água Lovable ocultada nas publicações Pro." },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-06-15",
    changes: [
      { type: "novo", text: "Central de notificações consolidada no topo." },
      { type: "novo", text: "Portal do Cliente com token exclusivo." },
      { type: "melhoria", text: "Isolamento multi-tenant reforçado em todas as rotas." },
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0]?.version ?? "1.0.0";
