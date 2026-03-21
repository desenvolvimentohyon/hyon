

## Plano: Vincular Tarefas ao Suporte (Tickets ↔ Tarefas)

### Resumo
Criar vinculação bidirecional entre tickets do portal e tarefas de suporte, permitindo criar tarefas a partir de tickets, listar/criar tarefas na aba Chamados, e associar tickets a tarefas existentes.

### 1. Migração: adicionar coluna de vínculo

Adicionar `linked_ticket_id` na tabela `tasks` (nullable, FK para `portal_tickets`) e `linked_task_id` na tabela `portal_tickets` (nullable, FK para `tasks`).

```sql
ALTER TABLE public.tasks ADD COLUMN linked_ticket_id uuid REFERENCES public.portal_tickets(id) ON DELETE SET NULL;
ALTER TABLE public.portal_tickets ADD COLUMN linked_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;
```

### 2. Atualizar o mapeamento de dados

**`src/contexts/AppContext.tsx`**
- No `dbToTarefa`, mapear `r.linked_ticket_id`
- No `tarefaToDb`, incluir `linked_ticket_id`
- Adicionar `linkedTicketId` ao tipo `Tarefa` em `src/types/index.ts`

### 3. Tab Portal Tickets — botão "Criar Tarefa"

**`src/pages/Suporte.tsx` — `PortalTicketsTab`**
- Ao visualizar um ticket, exibir botão **"Criar Tarefa de Suporte"** que:
  - Cria tarefa com `tipoOperacional: "suporte"`, `clienteId` do ticket, título prefixado "[Ticket] ..."
  - Grava `linked_ticket_id` na tarefa e `linked_task_id` no ticket
- Se já existir tarefa vinculada, mostrar badge com link para a tarefa

### 4. Tab Portal Tickets — botão "Vincular a Tarefa Existente"

- Adicionar botão **"Vincular Tarefa"** que abre um Dialog/Select com tarefas de suporte sem vínculo
- Ao selecionar, atualiza ambos os lados do vínculo

### 5. Tab Chamados — botão "Nova Tarefa de Suporte"

**`src/pages/Suporte.tsx` — TabsContent "chamados"**
- Adicionar botão **"+ Novo Chamado"** no header da tabela que navega para `/tarefas?nova=1&tipo=suporte`
- Na listagem de chamados abertos, exibir badge se o chamado tem ticket vinculado

### Arquivos editados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Adicionar `linked_ticket_id` em tasks e `linked_task_id` em portal_tickets |
| `src/types/index.ts` | Adicionar `linkedTicketId?: string` à interface Tarefa |
| `src/contexts/AppContext.tsx` | Mapear linked_ticket_id no dbToTarefa/tarefaToDb |
| `src/pages/Suporte.tsx` | Botões "Criar Tarefa", "Vincular Tarefa", "+ Novo Chamado", badges de vínculo |

