

## Plano: IA na Gestão de Tarefas (Voz + Sugestões Automáticas)

### Resumo
Integrar assistente IA leve no módulo de tarefas: criação por texto/voz, sugestões automáticas baseadas em dados do sistema, e botão "Gerar tarefas do dia". Sem alterar layout principal.

---

### 1. Edge Function: `ai-task-assistant`

**Arquivo:** `supabase/functions/ai-task-assistant/index.ts`

Recebe texto do usuário (digitado ou transcrito por voz) + contexto do sistema e retorna tarefa estruturada via tool calling (mesmo padrão do `ai-consultant`). Suporta 3 modos:

- **`create`**: Interpreta texto livre e gera título, descrição, prioridade, prazo, tipo operacional, categoria
- **`suggest`**: Recebe dados do sistema (clientes em atraso, boletos vencendo, etc.) e retorna lista de sugestões de tarefas
- **`daily`**: Gera pacote "tarefas do dia" baseado nos dados recebidos

Usa `LOVABLE_API_KEY` + Lovable AI Gateway com `google/gemini-3-flash-preview`. Trata erros 429/402.

---

### 2. Componente: `TaskAIModal`

**Arquivo:** `src/components/tarefas/TaskAIModal.tsx`

Modal simples com:
- Campo de texto "Descreva o que você precisa"
- Botão de microfone (Web Speech API `SpeechRecognition` nativo do browser, sem SDK externo)
- Ao enviar, chama edge function modo `create`
- Exibe preview da tarefa gerada (título, descrição, prioridade, prazo, tipo)
- Usuário revisa e clica "Criar" → chama `addTarefa`

**Voz:** Usa `window.SpeechRecognition` / `webkitSpeechRecognition` para transcrever voz → texto. Simples e sem dependências.

---

### 3. Componente: `TaskAISuggestions`

**Arquivo:** `src/components/tarefas/TaskAISuggestions.tsx`

Lista de sugestões geradas pela IA. Usado em 2 lugares:
- Na página de Tarefas (acima da tabela, colapsável)
- No Dashboard (card "Sugestões da IA")

Busca dados do sistema (clientes em atraso, boletos próximos do vencimento, etc.) via queries Supabase, envia para edge function modo `suggest`, exibe cards com botão "Criar".

---

### 4. Integração na página Tarefas

**Arquivo:** `src/pages/Tarefas.tsx`

- Adicionar botão **"🧠 Criar com IA"** ao lado de "Nova Tarefa" no header
- Adicionar botão **"Gerar tarefas do dia"** (ícone Zap)
- Renderizar `<TaskAISuggestions />` colapsável acima dos filtros
- Ao clicar "Gerar tarefas do dia", chama edge function modo `daily` e cria todas as tarefas retornadas

---

### 5. Card no Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

Adicionar card "Sugestões da IA" com `<TaskAISuggestions compact />` renderizando até 3 sugestões com link "Ver mais" para `/tarefas`.

---

### 6. Coluna `source` na tabela `tasks`

**Migração SQL:**
```sql
ALTER TABLE public.tasks ADD COLUMN source text NOT NULL DEFAULT 'manual';
```

Valores: `manual`, `ai`, `system`. Atualizar `tarefaToDb` para incluir `source`.

---

### Arquivos editados/criados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Adicionar coluna `source` |
| `supabase/functions/ai-task-assistant/index.ts` | Criar edge function |
| `src/components/tarefas/TaskAIModal.tsx` | Criar modal IA + voz |
| `src/components/tarefas/TaskAISuggestions.tsx` | Criar componente sugestões |
| `src/pages/Tarefas.tsx` | Botões "Criar com IA", "Gerar tarefas do dia", sugestões |
| `src/pages/Dashboard.tsx` | Card "Sugestões da IA" |
| `src/contexts/AppContext.tsx` | Mapear `source` no dbToTarefa/tarefaToDb |
| `src/types/index.ts` | Adicionar `source?: string` à interface Tarefa |

