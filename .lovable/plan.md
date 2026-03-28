

## Plano: Adicionar Opção de Inativar Cliente com Justificativa

### Resumo
Adicionar o status "inativo" ao sistema de clientes, com um fluxo similar ao de exclusão (cancelamento): o usuário clica em "Inativar" no menu de ações do card, preenche uma justificativa obrigatória, e o cliente é movido para o status "inativo". Clientes inativos ficam ocultos da visão padrão "Todos", assim como os cancelados.

### Alterações

**1. `src/types/receita.ts`** — Adicionar "inativo" ao tipo `StatusCliente`
```typescript
export type StatusCliente = "ativo" | "atraso" | "suspenso" | "cancelado" | "inativo";
```

**2. `src/pages/ClientesReceita.tsx`** — 4 mudanças:
- Adicionar "inativo" ao array `STATUSES`, `STATUS_LABELS` ("Inativo") e `STATUS_COLORS` (estilo cinza/neutral)
- Adicionar estado `inativarTarget` e `inativarJustificativa` (similar ao `deleteTarget`)
- Adicionar ação "Inativar" no `RowActions` do card (ícone `UserX`, entre "Ver detalhes" e "Excluir")
- Adicionar `AlertDialog` de confirmação com textarea para justificativa obrigatória
- No filtro padrão "todos", ocultar também clientes inativos (já oculta cancelados)

**3. `src/contexts/ReceitaContext.tsx`** — Adicionar função `inativarCliente`:
- Atualiza o status para "inativo" no banco (`clients.status = 'inativo'`)
- Salva a justificativa em `cancellation_reason` (reusa o campo existente)
- Salva a data em `cancelled_at`
- Mapeamento no `dbToClienteReceita` para reconhecer status "inativo"

**4. `src/components/clientes/ClienteCard.tsx`** — Garantir que o badge de status renderize corretamente o novo valor "inativo"

### Comportamento
- Clientes inativos ficam ocultos na aba "Todos" (junto com cancelados)
- Visíveis apenas quando o filtro "Inativo" é selecionado
- Podem ser reativados alterando o status de volta para "ativo" nos detalhes
- A justificativa é obrigatória antes de confirmar

### Arquivos Afetados
| Arquivo | Alteração |
|---|---|
| `src/types/receita.ts` | Adicionar "inativo" ao `StatusCliente` |
| `src/pages/ClientesReceita.tsx` | Ação no card, dialog de confirmação, filtro |
| `src/contexts/ReceitaContext.tsx` | Função `inativarCliente`, mapeamento do status |
| `src/components/clientes/ClienteCard.tsx` | Badge do novo status |

