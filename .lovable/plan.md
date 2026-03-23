

## Plano: Assistente Inteligente de Tarefas (Texto + Voz)

### Resumo
Adicionar um assistente de IA ao módulo de tarefas que permite criar tarefas por texto natural e por voz, além de sugerir tarefas automaticamente com base em dados do sistema.

### 1. Edge Function: `ai-task-assistant`

**Arquivo: `supabase/functions/ai-task-assistant/index.ts`**

Recebe texto do usuário + contexto (lista de clientes, técnicos) e usa Lovable AI (Gemini Flash) com tool calling para retornar tarefa estruturada:

```
Tool: parse_task
Retorna: { titulo, descricao, clienteNome?, prioridade, tipoOperacional, prazoDataHora?, responsavelNome? }
```

Segundo modo `type: "suggest"` — recebe dados do sistema (clientes inadimplentes, certificados vencendo, propostas aceitas) e retorna array de sugestões de tarefas.

### 2. Componente: `AiTaskAssistant`

**Arquivo: `src/components/tarefas/AiTaskAssistant.tsx`**

Card no topo da página de Tarefas com:

- **Campo de texto**: "Descreva a tarefa..." com botão "Criar com IA"
- **Botão de voz** 🎤: Usa Web Speech API (`webkitSpeechRecognition`) para capturar fala → converte em texto → envia à edge function
- **Preview da tarefa**: Após resposta da IA, exibe card com campos preenchidos (título, cliente, prioridade, data) com botões: "Criar", "Editar", "Cancelar"
- **Associação automática de cliente**: Match do nome retornado pela IA com `clientes` do contexto (fuzzy match simples)
- **Loading state** e tratamento de erros (429/402)

### 3. Painel de Sugestões Inteligentes

Dentro do mesmo componente, seção colapsável "Sugestões da IA":

- Ao abrir a página, faz query para buscar:
  - Clientes com `statusFinanceiro = '2_mais_atrasos'`
  - Certificados com vencimento < 30 dias
  - Propostas aceitas sem tarefa de implantação
- Envia esses dados à edge function (mode `suggest`)
- Renderiza cards de sugestão com botões: "Criar Tarefa" / "Ignorar"
- Cache de 5 minutos para não re-consultar

### 4. Integração na página Tarefas

**Arquivo: `src/pages/Tarefas.tsx`**

- Importar e inserir `<AiTaskAssistant />` entre o `ModuleNavGrid` e os filtros
- Passar `clientes`, `tecnicos`, `addTarefa` como props

### 5. Config TOML

**Arquivo: `supabase/config.toml`**

Adicionar:
```toml
[functions.ai-task-assistant]
verify_jwt = false
```

### Detalhes técnicos

- Web Speech API é nativa do navegador, sem dependência externa — fallback mostra toast se não suportado
- Edge function usa `LOVABLE_API_KEY` já disponível
- Tool calling garante resposta estruturada sem parsing de JSON instável
- Sugestões usam `react-query` com `staleTime: 300_000` (5min)

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/ai-task-assistant/index.ts` | **Novo** — Edge function com parsing + sugestões |
| `supabase/config.toml` | Adicionar bloco da nova função |
| `src/components/tarefas/AiTaskAssistant.tsx` | **Novo** — Componente do assistente |
| `src/pages/Tarefas.tsx` | Inserir `<AiTaskAssistant />` |

