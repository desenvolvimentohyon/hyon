

## Plano: Reduzir tamanho do modal "Nova Tarefa"

### Editar: `src/pages/Tarefas.tsx`

1. **Reduzir largura do modal**: Trocar `max-w-lg` por `max-w-md` no `DialogContent` (linha 435)
2. **Reduzir espaçamentos**: Diminuir `space-y-4` para `space-y-3`, reduzir `rows` das textareas
3. **Adicionar scroll**: Colocar `max-h-[80vh] overflow-y-auto` no conteúdo para que caiba em telas menores

| Arquivo | Mudança |
|---------|------|
| `src/pages/Tarefas.tsx` | Reduzir largura, espaçamentos e adicionar scroll ao modal |

