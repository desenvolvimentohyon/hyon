

## Plano: Mover badge "Atrasada" para coluna própria na tabela de tarefas

### Problema
O badge "Atrasada" está dentro da célula do título (junto ao texto), fazendo com que fique em posições diferentes dependendo do tamanho do título — sem alinhamento visual consistente.

### Solução
Criar uma coluna dedicada "Situação" na tabela para o badge "Atrasada", garantindo alinhamento uniforme.

### Editar: `src/pages/Tarefas.tsx`

1. **Adicionar coluna "Situação"** no `TableHeader` após "Prazo" (linha ~409)
2. **Remover o badge "Atrasada" de dentro da célula Título** (linha 420)
3. **Adicionar nova `TableCell`** com o badge "Atrasada" na nova coluna — exibindo o badge apenas quando a tarefa está atrasada, ou "—" caso contrário

| Arquivo | Mudança |
|---------|------|
| `src/pages/Tarefas.tsx` | Mover badge "Atrasada" do título para coluna própria |

