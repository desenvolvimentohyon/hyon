

## Plano: Ao concluir tarefa, forçar status e prioridade para "concluída/baixa"

### Resumo
Quando o status de uma tarefa mudar para `concluida` (seja manualmente, pelo checklist automático, ou drag-and-drop), o sistema automaticamente seta a prioridade para `baixa` e garante que o status fique `concluida`. Também para o timer se estiver rodando.

### Editar: `src/contexts/AppContext.tsx` — Lógica dentro de `updateTarefa`

Após a linha 241 (merge das changes), adicionar verificação:

```text
Se o status final for "concluida":
  - Forçar prioridade = "baixa"
  - Parar timer se estiver rodando (calcular elapsed, setar timer_running=false)
  - Registrar no histórico: "Tarefa concluída — prioridade e timer ajustados automaticamente"
```

Isso será aplicado antes de montar o `dbUpdate`, garantindo que qualquer caminho que conclua a tarefa (checklist 100%, drag kanban, mudança manual) passe pela mesma lógica.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AppContext.tsx` | Auto-setar prioridade=baixa e parar timer ao concluir tarefa |

