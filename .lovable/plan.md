

## Plano: Assistente Central IA (Jarvis Corporativo)

### Resumo
Criar uma IA central que funciona como assistente executivo: sauda o usuário, resume o dia, alerta sobre riscos, sugere ações e responde perguntas conversacionais — tudo integrado com os dados reais do sistema.

### Arquitetura

**3 novos arquivos + 2 edições:**

### 1. Edge Function: `supabase/functions/ai-consultant/index.ts` (atualizar)

A edge function existente será expandida para suportar um novo modo `type: "executive_briefing"` que:
- Recebe contexto completo do sistema (resumo de clientes, financeiro, propostas, tarefas, certificados, renovações)
- Retorna via tool calling uma estrutura `ExecutiveBriefing`:
  - `saudacao` (saudação contextual com nome do usuário)
  - `resumoDia` (texto markdown com resumo executivo)
  - `alertas[]` (prioridade, categoria, titulo, descricao, acao_sugerida)
  - `sugestoes[]` (titulo, descricao, tipo_acao, dados_acao)
  - `metricas` (mrr, clientes_ativos, inadimplentes, propostas_abertas, tickets_abertos, tarefas_pendentes)

Também suportar `type: "chat"` para conversação livre, onde o usuário faz perguntas e a IA responde com base no contexto do sistema (streaming SSE).

### 2. Novo componente: `src/components/ai/AiExecutiveAssistant.tsx`

Componente principal que aparece no Dashboard, contendo:

**Seção 1 — Saudação + Resumo**
- Card com saudação baseada no horário ("Bom dia, {nome}")
- Resumo executivo do dia em texto markdown (renderizado com `react-markdown`)
- Métricas rápidas inline (MRR, clientes ativos, tickets)

**Seção 2 — Alertas Inteligentes**
- Lista de alertas categorizados (Comercial/Financeiro/Clientes/Suporte)
- Badges de prioridade (vermelho/amarelo/verde)
- Cada alerta com botões: "Criar ação" / "Ignorar"

**Seção 3 — Sugestões de Ação**
- Cards com ações sugeridas pela IA
- Botões: Criar tarefa / Editar antes / Ignorar
- Integração com `addTarefa` do AppContext

**Seção 4 — Chat Conversacional**
- Campo de input tipo chat no rodapé do card
- Streaming de respostas (SSE)
- Exemplos de perguntas como placeholders rotativos
- Histórico da conversa na sessão

**Dados**: Hook interno com `react-query` que:
1. Busca contagens de clientes, títulos financeiros, propostas, tarefas, certificados
2. Envia tudo à edge function para gerar o briefing
3. `staleTime: 300_000` (5min), refresh ao focar a janela

### 3. Novo hook: `src/hooks/useExecutiveBriefing.ts`

Hook que agrega dados de todas as tabelas relevantes em queries paralelas:
- `clients` → ativos, em atraso, novos no mês, certificados vencendo em 30d
- `financial_titles` → MRR, inadimplência, títulos vencidos
- `proposals` → abertas, sem visualização, aceitas no mês
- `tasks` → pendentes, urgentes, atrasadas
- `portal_tickets` → abertos, em andamento

Envia o contexto agregado à edge function e retorna o briefing estruturado.

### 4. Integração no Dashboard

**Arquivo: `src/pages/Dashboard.tsx`**

- Inserir `<AiExecutiveAssistant />` como primeiro elemento após o `PageHeader` e `ModuleNavGrid`
- Componente colapsável para não dominar a tela (expandido por padrão na primeira visita do dia)
- Botão de refresh manual

### 5. Config TOML

A edge function `ai-consultant` já existe no config.toml com `verify_jwt = false` — sem alteração necessária.

### Detalhes técnicos

- **Streaming**: O chat conversacional usa SSE para respostas em tempo real
- **Saudação por horário**: Lógica client-side (antes das 12h = Bom dia, 12-18h = Boa tarde, depois = Boa noite)
- **Performance**: Queries agregadas com `count()` e filtros diretos, sem trazer registros completos
- **Sem alteração de banco**: Todas as queries usam tabelas existentes
- **Nome do usuário**: Obtido do `profile.full_name` via `useAuth()`

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/ai-consultant/index.ts` | Expandir com modos `executive_briefing` e `chat` |
| `src/hooks/useExecutiveBriefing.ts` | **Novo** — agregação de dados + chamada à IA |
| `src/components/ai/AiExecutiveAssistant.tsx` | **Novo** — UI do assistente (briefing + alertas + chat) |
| `src/pages/Dashboard.tsx` | Inserir `<AiExecutiveAssistant />` |

