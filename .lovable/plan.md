

# PRD Parte 2 — Módulo Operacional para Revenda de Software ERP

## Resumo

Expandir o sistema existente de gerenciador de tarefas para incluir 4 módulos operacionais (Comercial, Implantação, Suporte, Treinamento/Financeiro), perfil técnico do cliente, dashboard executivo e automações simuladas. Tudo continua 100% local com localStorage.

---

## Alterações no Modelo de Dados

### Tarefa — novos campos
- `tipoOperacional`: "comercial" | "implantacao" | "suporte" | "treinamento" | "financeiro" | "interno"
- `sistemaRelacionado`: "hyon" | "linkpro" | null
- `moduloRelacionado`: "estoque" | "fiscal" | "financeiro" | "relatorios" | null
- `slaHoras`, `reincidente`, `geraCobrancaExtra`, `valorCobrancaExtra`
- `etapaImplantacao`, `riscoCancelamento`
- Campos comerciais: `valorProposta`, `tipoPlano`, `dataPrevisaoFechamento`, `origemLead`, `statusComercial`
- Campos treinamento: `setorTreinamento`, `horasMinistradas`, `participantes`, `treinamentoExtraCobrado`

### Cliente — novos campos
- `sistemaUsado`: "hyon" | "linkpro"
- `usaCloud`, `usaTEF`, `usaPagamentoIntegrado`
- `tipoNegocio`, `perfilCliente`: "conservador" | "resistente" | "estrategico"
- `scoreSaude` (calculado no front)
- `mensalidadeAtual`, `statusFinanceiro`: "em_dia" | "1_atraso" | "2_mais_atrasos"
- `riscoCancelamento`

### Nova entidade: TemplateImplantacao
- `id`, `nome`, `sistemaRelacionado`, `etapas[]` (texto + responsavelPadraoId)

---

## Novas Páginas e Rotas

1. **`/comercial`** — Pipeline Comercial (Kanban: Lead → Proposta → Negociação → Fechado → Perdido)
2. **`/implantacao`** — Lista de implantações em andamento com barra de progresso e templates
3. **`/suporte`** — Dashboard de suporte com SLA, chamados vencidos, métricas
4. **`/executivo`** — Painel Executivo com KPIs consolidados

---

## Sidebar atualizada
Adicionar seções agrupadas:
- **Operacional**: Dashboard, Tarefas
- **Módulos**: Comercial, Implantação, Suporte
- **Gestão**: Clientes, Técnicos, Painel Executivo, Configurações

---

## Funcionalidades por Módulo

### Comercial
- Kanban com colunas de pipeline comercial
- Formulário de lead com campos específicos (valor, plano, origem, data prevista)
- Botão "Converter em Cliente" que cria cliente + tarefa de implantação automaticamente
- Registrar objeções e motivo de perda

### Implantação
- Templates reutilizáveis de implantação (ex: "Hyon Alimentação")
- Ao criar implantação: gerar subtarefas automaticamente a partir do template
- Barra de progresso geral (baseada nas subtarefas)
- Alerta visual se prazo ultrapassado
- Regra: só concluir se todas etapas concluídas

### Suporte
- Dashboard com: chamados abertos, SLA vencido, tempo médio resolução, top clientes
- Prioridade automática sugerida baseada em palavras-chave na descrição
- Contador regressivo visual de SLA em cada tarefa
- Badge de SLA vencido

### Treinamento + Financeiro
- Campos de treinamento na tarefa (setor, horas, participantes, cobrança extra)
- Tarefas financeiras automáticas simuladas (renovação, reajuste, atraso)
- Badges visuais de risco: vermelho (alto), amarelo (atenção), verde (saudável)

---

## Dashboard Executivo
- Clientes ativos, em implantação
- Receita recorrente estimada (fake)
- Implantações atrasadas
- Chamados abertos
- Clientes com risco alto
- Ticket médio estimado

---

## Score de Saúde do Cliente
Calculado no front-end com base em:
- Número de chamados de suporte
- Status financeiro (atrasos)
- Tempo médio de resolução dos chamados
Exibido como badge colorido no perfil do cliente

---

## Automações Simuladas (local)
- Fechar venda → criar tarefa de implantação
- Concluir implantação → criar tarefa pós-implantação (prazo +15 dias)
- Cliente com 2+ atrasos → criar tarefa de contato financeiro

---

## Filtros Avançados na página Tarefas
Adicionar filtros: tipo operacional, sistema (Hyon/LinkPro), módulo, risco cancelamento, cobrança extra, SLA vencido, implantação atrasada

---

## Identidade Visual por Tipo Operacional
| Tipo | Cor | Ícone |
|------|-----|-------|
| Comercial | Azul | TrendingUp |
| Implantação | Roxo | Rocket |
| Suporte | Laranja | Headphones |
| Treinamento | Verde | GraduationCap |
| Financeiro | Vermelho | DollarSign |
| Interno | Cinza | Building |

---

## Seed Atualizado
- 8 clientes (com perfil técnico, sistema, score)
- 4 técnicos
- 5 leads comerciais (tarefas tipo comercial com statusComercial variado)
- 3 implantações em andamento (com subtarefas)
- 12 chamados de suporte (alguns com SLA vencido)
- 4 treinamentos
- 2 clientes com risco de cancelamento
- Tarefas financeiras simuladas

---

## Arquivos a criar/modificar

**Modificar:**
- `src/types/index.ts` — novos tipos e campos
- `src/data/seed.ts` — seed expandido
- `src/contexts/AppContext.tsx` — novos métodos, automações, score de saúde
- `src/App.tsx` — novas rotas
- `src/components/layout/AppSidebar.tsx` — novos itens de menu agrupados
- `src/pages/Tarefas.tsx` — filtros avançados, badge tipo operacional
- `src/pages/TarefaDetalhe.tsx` — campos dos módulos
- `src/pages/Clientes.tsx` — perfil técnico, score de saúde
- `src/pages/Dashboard.tsx` — ajustes menores

**Criar:**
- `src/pages/Comercial.tsx` — Pipeline comercial
- `src/pages/Implantacao.tsx` — Gestão de implantações
- `src/pages/Suporte.tsx` — Dashboard de suporte
- `src/pages/Executivo.tsx` — Painel executivo
- `src/lib/constants.ts` — cores, ícones e labels dos tipos operacionais

