

## Plano: Auto-iniciar cronômetro ao criar tarefa + exibir tempo na listagem

### Resumo
Quando uma tarefa for criada, o cronômetro será automaticamente iniciado. Na tela de tarefas (tabela e kanban), cada tarefa exibirá o tempo decorrido em tempo real.

### 1. Editar: `src/contexts/AppContext.tsx` — Auto-start timer on task creation

Na função `addTarefa`, após o insert no banco, chamar `startTimer` automaticamente com o ID da tarefa recém-criada.

- Após o `supabase.from("tasks").insert(...)`, usar o `data.id` retornado para fazer um update imediato setando `timer_running: true` e `timer_started_at: now()`.
- Isso respeita a regra existente de parar qualquer outro timer ativo antes.

### 2. Editar: `src/pages/Tarefas.tsx` — Exibir tempo em cada tarefa

**Na tabela:**
- Adicionar coluna "Tempo" no `TableHeader`
- Em cada `TableRow`, exibir o tempo formatado (HH:MM:SS) com atualização em tempo real para tarefas com timer ativo
- Ícone de relógio pulsante quando o timer está rodando

**No kanban (componente `KanbanTarefas`):**
- Adicionar linha com ícone de relógio + tempo formatado em cada card
- Animação sutil (pulsing dot) quando o timer está ativo

### 3. Criar: Componente helper `LiveTimer` inline

Um pequeno componente que recebe `tempoTotalSegundos`, `timerRodando` e `timerInicioTimestamp`, e usa `useEffect` + `setInterval` para atualizar o display a cada segundo quando o timer está ativo. Será usado tanto na tabela quanto no kanban.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AppContext.tsx` | Auto-start timer após criar tarefa |
| `src/pages/Tarefas.tsx` | Componente `LiveTimer` + coluna/badge de tempo na tabela e kanban |

### Notas
- A regra de "apenas um timer ativo" será respeitada: ao criar uma nova tarefa, qualquer timer rodando em outra tarefa será pausado automaticamente.
- O formato será `HH:MM:SS` para consistência com a tela de detalhe.

