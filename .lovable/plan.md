

## Plano: Colorir tarefas por status

### Resumo
Aplicar cor de fundo sutil em cada tarefa (linha da tabela e card do kanban) de acordo com o status, facilitando a identificação visual imediata.

### Editar: `src/pages/Tarefas.tsx`

**1. Criar função `statusRowColor`** que retorna classes de fundo sutil para cada status:

| Status | Cor |
|--------|-----|
| `concluida` | Verde claro (`bg-emerald-50 dark:bg-emerald-950/30`) |
| `em_andamento` | Azul claro (`bg-blue-50 dark:bg-blue-950/30`) |
| `aguardando_cliente` | Amarelo claro (`bg-amber-50 dark:bg-amber-950/30`) |
| `a_fazer` | Cinza claro (`bg-slate-50 dark:bg-slate-900/30`) |
| `cancelada` | Vermelho claro (`bg-red-50 dark:bg-red-950/20`) |
| `backlog` | Neutro (sem cor extra) |

**2. Tabela** — Adicionar a classe de cor na `TableRow` (linha 380), junto com borda lateral colorida (`border-l-4`).

**3. Kanban** — Adicionar a classe de cor no `Card` de cada tarefa (linha 92-97), com borda lateral colorida.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Tarefas.tsx` | Função `statusRowColor` + aplicar nas rows da tabela e cards do kanban |

