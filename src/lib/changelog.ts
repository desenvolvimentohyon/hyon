export interface ChangelogEntry {
  version: string;
  date: string; // ISO
  changes: { type: "novo" | "melhoria" | "correcao"; text: string }[];
}

// Ordem: mais recente primeiro. Ao subir uma nova versão, adicione no topo.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.7.0",
    date: "2026-08-11",
    changes: [
      { type: "novo", text: "Infraestrutura Hyon IA: Implantada a Edge Function global 'ia-assistant' integrada ao Lovable AI Gateway." },
      { type: "melhoria", text: "Inteligência Contextual: O chat lateral agora processa o contexto de navegação em tempo real (Financeiro, CRM, Operacional) para respostas precisas." },
      { type: "melhoria", text: "Resiliência de Backend: Adicionada validação de LOVABLE_API_KEY no ambiente de execução para evitar falhas intermitentes." },
    ]
  },
  {
    version: "2.6.5",
    date: "2026-08-11",
    changes: [
      { type: "melhoria", text: "Endurecimento de Segurança: Revogados GRANTS de acesso público (anon) em tabelas sensíveis, forçando uso estrito de RLS e autenticação." },
      { type: "melhoria", text: "Privilégios de Execução: Restrita a execução de funções SECURITY DEFINER analíticas e administrativas apenas para usuários autenticados e service_role." },
      { type: "melhoria", text: "Hardening de RLS: Reforçadas as políticas de acesso e proteção de integridade org_id em tabelas de configuração e infraestrutura." },
      { type: "correcao", text: "Segurança de Funções: Garantido search_path explícito em todas as funções SECURITY DEFINER para mitigar riscos de Search Path Hijacking." }
    ]
  },
  {
    version: "2.5.1",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "UX Tipográfica: Corrigido o espaçamento entre letras (letter-spacing) para evitar o efeito de letras 'corridas' em telas PWA e mobile." },
      { type: "melhoria", text: "Legibilidade: Ajustada a escala de tracking e kern global, removendo o aperto excessivo em títulos h1/h2 e corpo de texto." },
      { type: "melhoria", text: "Suporte PWA: Otimizado o motor de renderização de texto para garantir clareza visual em ícones e componentes de alta densidade." }
    ]
  },
  {
    version: "2.5.0",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Performance: Implementado Code Splitting e Lazy Loading em 100% das rotas do sistema." },
      { type: "melhoria", text: "Build: Otimizado Vite com manualChunks para reduzir bundle size e acelerar cache de vendors." },
      { type: "melhoria", text: "Cache: Configurado TanStack Query com staleTime global e otimizada estratégia de runtime caching do PWA." },
      { type: "melhoria", text: "Backend: Otimizadas queries globais do FinanceiroContext com limites de segurança e ordenação indexada." }
    ]
  },
  {
    version: "2.4.0",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Design System: Transição para UI Moderna Minimalista (Clean) com foco em respiro e tipografia Space Grotesk." },
      { type: "melhoria", text: "UX de Navegação: Expansão de espaçamentos no layout principal e refinamento da Topbar para 16px de altura." },
      { type: "melhoria", text: "Componentização: Padronização de botões, inputs e cards com raios de borda aumentados (12px-14px) e sombras suaves." },
      { type: "melhoria", text: "Acessibilidade: Refinamento de contrastes e focos interativos no tema claro e escuro." }
    ]
  },
  {
    version: "2.3.0",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Auditoria Técnica Global: Realizada varredura completa do sistema para correção de falhas de lógica, tipos e UX." },
      { type: "correcao", text: "Estabilidade Financeira: Corrigida falha no fechamento de modais de baixa parcial e tratamento de valores nulos em novos títulos." },
      { type: "melhoria", text: "UX de Tarefas: Refinada a interface de alteração de status inline na listagem para maior precisão e feedback visual." },
      { type: "melhoria", text: "Resiliência de Dados: Endurecidos mappers de contexto e tratamento de erros no carregamento de perfis multi-tenant." },
      { type: "correcao", text: "Integridade de Schema: Removidos Type Casts desnecessários em queries Supabase após validação de tipos." }
    ]
  },
  {
    version: "2.2.6",
    date: "2026-08-10",
    changes: [
      { type: "correcao", text: "Integridade de Roteamento: Restauradas rotas críticas de Inteligência, Comercial, Financeiro e Operacional que haviam sido removidas." },
      { type: "correcao", text: "Central de Tarefas: Recuperada toolbar unificada de filtros e melhorada a disposição dos seletores de Cliente, Sistema e Técnico." },
      { type: "melhoria", text: "UX de Navegação: Corrigido o redirecionamento indevido para o Dashboard em módulos protegidos e restauradas rotas públicas de aceite e portal." }
    ]
  },
  {
    version: "2.2.4",
    date: "2026-08-10",
    changes: [
      { type: "correcao", text: "Identidade Visual em Propostas: Corrigida a renderização da logo e cores da empresa na página pública de aceite." },
      { type: "melhoria", text: "Integridade de Dados: Corrigido o fluxo de persistência de informações adicionais e módulos na geração de propostas inteligentes." },
      { type: "melhoria", text: "UX de Proposta: Otimizado o header público com suporte a branding dinâmico e carregamento seguro de assets." }
    ]
  },
  {
    version: "2.2.3",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Audit de Segurança Avançado: Implementados gatilhos de integridade multi-tenant em tabelas críticas (clientes, tarefas, credenciais)." },
      { type: "melhoria", text: "Hardening de RLS: Reforçadas políticas de acesso granular em tabelas de configuração e infraestrutura." },
      { type: "melhoria", text: "Privacidade e Governança: Restrito acesso a metadados de webhook e auditoria apenas para roles administrativos autenticados." }
    ]
  },
  {
    version: "2.2.2",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Endurecimento de Segurança: Implementados gatilhos de proteção de integridade org_id em tabelas de clientes, tarefas e credenciais." },
      { type: "melhoria", text: "Reforço de RLS: Atualizadas políticas da tabela access_credentials para suportar permissões granulares de visualização e edição." },
      { type: "melhoria", text: "Privacidade de Webhooks: Restrito acesso total a logs de webhook do ASAAS apenas para administradores autorizados." },
      { type: "melhoria", text: "Isolamento de Infraestrutura: Configurados GRANTs explícitos para service_role em tabelas de metadados e RBAC." }
    ]
  },
  {
    version: "2.2.0",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Reforço de Segurança: Implementado endurecimento de funções SECURITY DEFINER com search_path explícito e restrição de execução por role." },
      { type: "melhoria", text: "Isolamento Multi-tenant: Refatorada a função has_permission para garantir isolamento total e prevenção de escalonamento de privilégios." },
      { type: "correcao", text: "Políticas RLS: Corrigidas e reforçadas políticas em tabelas críticas como landing_plan_leads e configurações internas." },
      { type: "novo", text: "Proteção de Integridade: Adicionados gatilhos de banco para impedir a alteração não autorizada de org_id em registros financeiros." }
    ]
  },
  {
    version: "2.1.9",
    date: "2026-08-10",
    changes: [
      { type: "novo", text: "Página 404 Personalizada: Implementada interface 'Graphite Premium' para rotas inexistentes, evitando o redirecionamento silencioso." },
      { type: "correcao", text: "Integridade de Rotas Públicas: Validada a renderização e o acesso ao Portal do Cliente e Aceite de Proposta." },
      { type: "melhoria", text: "Otimização de Performance: Refinada a lógica de filtros complexos na Central de Tarefas para bases de dados volumosas." },
      { type: "melhoria", text: "UX de Navegação: Ajustado o sistema de roteamento global para oferecer feedback contextualizado em falhas de URL." }
    ]
  },
  {
    version: "2.1.8",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Visualização Financeira Premium: Redesign dos cards de KPI com glassmorphism, sombras suaves e tipografia otimizada para legibilidade." },
      { type: "melhoria", text: "UX Financeira: Implementação de Tooltips em ações de tabela e melhoria na exibição de saldo devedor em Contas a Receber." },
      { type: "correcao", text: "Estabilidade de Build: Corrigidos erros de referências a ícones inexistentes do Lucide React em diversas páginas." },
      { type: "melhoria", text: "Inteligência de Dados: Refinamento no prompt da Hyon IA para resumos diários mais técnicos e precisos." },
    ],
  },
  {
    version: "2.1.7",
    date: "2026-08-10",
    changes: [
      { type: "novo", text: "Atalhos de Teclado: Implementados comandos rápidos para produtividade ('N' para nova tarefa, 'F' para busca/filtros)." },
      { type: "novo", text: "Linha do Tempo (Gantt): Adicionada nova visualização de cronograma para gestão visual de prazos e projetos complexos." },
      { type: "melhoria", text: "UX de Navegação: Adicionados tooltips informativos e suporte a alternância de visões via teclado (T, K, G)." },
    ],
  },
  {
    version: "2.1.6",
    date: "2026-08-10",
    changes: [
      { type: "novo", text: "Central de Tarefas 2.0: Remodelagem completa da interface com foco em produtividade, performance e UX mobile-first." },
      { type: "melhoria", text: "Kanban de Alta Densidade: Novo layout de colunas com cards compactos, indicadores de atraso e suporte a drag-and-drop otimizado." },
      { type: "melhoria", text: "Barra de Ferramentas Unificada: Filtros inteligentes e busca rápida integrados em uma única linha para maior aproveitamento de tela." },
    ],
  },
  {
    version: "2.1.5",
    date: "2026-08-10",
    changes: [
      { type: "novo", text: "Emissão de Recibos Individuais: Implementada a geração de recibos/comprovantes profissionais para cada baixa parcial no histórico do título." },
      { type: "melhoria", text: "Histórico Detalhado: O histórico de movimentos agora exibe número, data, valor e forma de recebimento de forma mais didática." },
    ],
  },
  {
    version: "2.1.4",
    date: "2026-08-10",
    changes: [
      { type: "novo", text: "Histórico de Pagamentos: Implementada a visualização detalhada de lançamentos vinculados (movimentos) dentro dos modais de edição de títulos." },
      { type: "melhoria", text: "Visibilidade de Saldo Devedor: Adicionado cálculo dinâmico de saldo restante em Contas a Receber e Pagar para títulos com status 'parcial'." },
    ],
  },
  {
    version: "2.1.3",
    date: "2026-08-10",
    changes: [
      { type: "novo", text: "Visualização de Saldo Devedor: Adicionada a exibição do saldo remanescente diretamente na listagem para títulos com baixa parcial." },
      { type: "melhoria", text: "Transparência Financeira: O valor total do título agora é calculado considerando descontos, juros e multas para uma visão precisa do saldo." },
    ],
  },
  {
    version: "2.1.2",
    date: "2026-08-10",
    changes: [
      { type: "novo", text: "Baixa Parcial Financeira: Habilitada a opção de recebimento ou baixa parcial em Contas a Receber e Contas a Pagar." },
      { type: "melhoria", text: "Gestão de Saldo: O sistema agora calcula automaticamente o saldo remanescente e atualiza o status para 'parcial' quando o valor pago é inferior ao total." },
    ],
  },
  {
    version: "2.1.1",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Remoção de Resíduos de Módulos: Eliminadas referências visuais e lógicas remanescentes dos módulos de Cartões e Desenvolvimento no menu lateral e barras de navegação." },
      { type: "correcao", text: "Integridade do Menu Lateral: Corrigida a persistência de ícones de módulos desativados na AppSidebar e ModuleNavBar." },
    ],
  },
  {
    version: "2.1.0",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Responsividade 360°: Implementado sistema mobile-first em toda a aplicação com suporte a touch e escalas fluidas." },
      { type: "melhoria", text: "Escala Tipográfica Fluida: Uso de clamp() para garantir legibilidade perfeita de h1 a body em qualquer dispositivo." },
      { type: "melhoria", text: "Otimização de Layouts: Grids adaptativos e containers flexíveis para eliminar overflow horizontal." },
    ],
  },
  {
    version: "2.0.3",
    date: "2026-08-10",
    changes: [
      { type: "correcao", text: "Reforço de Segurança: Implementada proteção contra escalonamento de privilégios em perfis de usuários." },
      { type: "correcao", text: "RLS Estrito: Refinamento das políticas de acesso para reuniões públicas e isolamento multi-tenant." },
      { type: "correcao", text: "Integridade de Dados: Adicionados gatilhos de banco para validar consistência em operações de atualização." },
    ],
  },
  {
    version: "2.0.2",
    date: "2026-08-10",
    changes: [
      { type: "correcao", text: "Integridade de Rotas: Restauradas todas as rotas de sub-módulos e links públicos que estavam inacessíveis." },
      { type: "correcao", text: "KPIs Dinâmicos: O badge de mês nos cards financeiros agora reflete automaticamente o mês atual via sistema." },
    ],
  },
  {
    version: "2.0.1",
    date: "2026-08-10",
    changes: [
      { type: "melhoria", text: "Responsividade: Otimizados os novos cards de KPI para visualização perfeita em dispositivos com telas reduzidas." },
      { type: "melhoria", text: "Fidelidade de Impressão: Revisada a exportação de PDF para garantir que o layout 'Premium' seja preservado em relatórios físicos." },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-08-10",
    changes: [
      { type: "novo", text: "Remodelagem Financeira Pro: Redesign completo da interface financeira com foco em cards de alta performance e visual minimalista premium." },
      { type: "melhoria", text: "Motor de KPIs: Otimização nos cálculos de MRR, Inadimplência e Fluxo de Caixa para precisão em tempo real." },
      { type: "melhoria", text: "Experiência Visual: Introdução de tokens de glow semântico e elevação de componentes para melhor hierarquia de dados." },
    ],
  },
  {
    version: "1.9.1",
    date: "2026-08-09",
    changes: [
      { type: "melhoria", text: "Auditoria de Segurança: Iniciada validação dos novos parâmetros de RLS para garantir isolamento total após simplificação de módulos." },
      { type: "melhoria", text: "Revisão RBAC: Removidas referências a cargos e permissões de módulos descontinuados (Cartões/Desenvolvimento)." },
    ],
  },
  {
    version: "1.9.0",
    date: "2026-08-07",
    changes: [
      { type: "melhoria", text: "Simplificação de Escopo: Módulos de Cartões e Desenvolvimento removidos para focar nas funcionalidades core do ERP." },
      { type: "melhoria", text: "Limpeza de Banco de Dados: Tabelas legadas e registros órfãos dos módulos desativados foram removidos permanentemente." },
      { type: "correcao", text: "Estabilidade Estrutural: Removidos hooks, rotas e componentes órfãos para reduzir o débito técnico e melhorar a manutenção." },
    ],
  },
  {
    version: "1.8.9",
    date: "2026-08-06",
    changes: [
      { type: "melhoria", text: "Governança de Alertas: Refinada interface de multi-seleção de destinatários para alertas críticos." },
      { type: "melhoria", text: "Integridade Estrutural: Corrigidas importações e estabilizado fluxo de rotas financeiras." },
      { type: "novo", text: "Contexto Visual Dinâmico: Implementado banner de instrução sistêmica no topo da aplicação." },
    ],
  },
  {
    version: "1.8.7",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Multi-select de Destinatários: Implementada interface visual para seleção múltipla de gestores no disparo de alertas críticos." },
      { type: "novo", text: "Drill-down de Perdas: Adicionada capacidade de listar clientes específicos diretamente ao interagir com o gráfico de Perda por Gravidade." },
      { type: "melhoria", text: "Inteligência de Vínculo: Novo trigger de banco automatiza a associação de registros legados a clientes via heurística de nome." },
    ],
  },
  {
    version: "1.8.6",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Comparativo MRR vs Perda: Radar de Crescimento agora quantifica o custo de oportunidade como porcentagem real do faturamento mensal." },
      { type: "melhoria", text: "Precisão Financeira: Motor de análise de falhas agora utiliza o valor de mensalidade real vinculado ao cliente via client_id." },
      { type: "melhoria", text: "Infraestrutura de Destinatários: Preparada interface para seleção granular de múltiplos usuários em alertas críticos." },
    ],
  },
  {
    version: "1.8.5",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Filtros Temporais IA: Implementada segmentação Trimestral e Semestral no dashboard de análise de falhas estratégicas." },
      { type: "novo", text: "Custo de Oportunidade: Nova visualização no Radar de Crescimento quantificando o impacto financeiro de planos de recuperação não convertidos." },
      { type: "melhoria", text: "Governança de Alertas: Adicionado suporte a múltiplos destinatários específicos por tipo de risco na infraestrutura de notificações push." },
    ],
  },
  {
    version: "1.8.4",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Dashboard de Conversão Financeira: Análise de impacto monetário das falhas estratégicas segmentada por gravidade." },
      { type: "novo", text: "Push Alertas Diferenciados: Notificações inteligentes agora possuem urgência visual e textual baseada na gravidade do risco (Alto/Médio/Baixo)." },
      { type: "melhoria", text: "Relatórios PDF Expandidos: Exportação agora inclui identificação de clientes e detalhamento de perdas financeiras estimadas." },
    ],
  },
  {
    version: "1.8.3",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Filtros de Gravidade: Adicionada segmentação por risco (Alto/Médio/Baixo) no histórico e análise de falhas." },
      { type: "novo", text: "Relatórios Estratégicos PDF: Implementada exportação de logs de falha com metadados de gravidade e insights." },
      { type: "melhoria", text: "Automação de QA: Criada suíte de testes E2E para validação de transições de status e integridade do isolamento multitenant." },
    ],
  },
  {
    version: "1.8.2",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Dashboard Analítico de Falhas: Implementada visualização de motivos de insucesso nos planos de recuperação IA." },
      { type: "novo", text: "Automação 'Falha por Omissão': Planos expirados agora são movidos automaticamente para status de falha com justificativa técnica." },
      { type: "melhoria", text: "Refinamento de Contexto IA: O motor de insights agora considera o histórico de falhas para evitar repetição de estratégias ineficazes." },
    ],
  },
  {
    version: "1.8.1",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Filtro de Expirados: Adicionada opção de filtrar apenas planos de recuperação com data limite ultrapassada no histórico do Dashboard." },
      { type: "novo", text: "Análise de Falhas: Implementado campo de 'Motivo da Falha' para planos abortados, permitindo coletar dados para otimização do motor de IA." },
      { type: "melhoria", text: "Visualização de Status: Planos expirados agora recebem destaque visual (borda e badge específicos) para facilitar a identificação de riscos não tratados." },
    ],
  },
  {
    version: "1.8.0",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Taxa de Sucesso IA: Implementado gráfico de conversão dos planos de recuperação no Radar de Crescimento." },
      { type: "novo", text: "Alertas de Expiração: Adicionadas notificações push para planos de recuperação que atingem a data limite sem conclusão." },
      { type: "melhoria", text: "Inteligência de Recuperação: Dashboards agora exibem métricas reais de eficácia das estratégias sugeridas pela IA." },
    ],
  },
  {
    version: "1.7.9",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Filtros Avançados de Histórico: Adicionados filtros por data e tipo de risco no acompanhamento de planos de recuperação IA." },
      { type: "novo", text: "Métricas de Conversão: Implementado sistema de tracking para eficácia de planos executados, com status de conversão e data de conclusão." },
      { type: "melhoria", text: "Segmentação de Risco: IA agora categoriza riscos entre inadimplência, churn e gargalos operacionais para melhores planos estratégicos." },
    ],
  },
  {
    version: "1.7.8",
    date: "2026-08-06",
    changes: [
      { type: "novo", text: "Painel de Histórico IA: Adicionado card no Dashboard para visualização e acompanhamento dos últimos Planos de Recuperação gerados." },
      { type: "novo", text: "Histórico de Planos de Recuperação: Planos estratégicos gerados pela IA agora são persistidos para auditoria e acompanhamento de eficácia." },
      { type: "melhoria", text: "Alertas Push Multiusuário: Refatorada lógica de envio de notificações para suportar múltiplos destinatários simultaneamente." },
      { type: "novo", text: "Alertas Push Inteligentes: Adicionada a capacidade de disparar notificações instantâneas para gestores a partir de insights da IA." },
      { type: "novo", text: "Plano de Recuperação IA: Integrado gerador de estratégias em 5 passos para mitigação de riscos de inadimplência e churn." },
      { type: "melhoria", text: "Alertas Inteligentes de Risco: Implementados cards de alerta com análise preditiva de IA para inadimplência e churn no Dashboard." },
      { type: "melhoria", text: "Justificativa Textual IA: Alertas agora incluem razões detalhadas e sugestões de ação baseadas nos dados financeiros reais." },
      { type: "novo", text: "Resumo Diário Inteligente: O Dashboard agora exibe um briefing matinal gerado pela Hyon IA sobre prioridades, MRR e riscos operacionais." },
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