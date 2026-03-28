

## Plano: Corrigir Contagem de Clientes Ativos no Cockpit

### Causa Raiz

No `Cockpit.tsx` (linha 65), a contagem de clientes ativos usa:
```typescript
const ativos = clientesReceita.filter(c => c.mensalidadeAtiva);
```

Isso filtra pelo campo `recurrence_active` do banco, e não pelo `status = 'ativo'`. Clientes com status ativo mas com recorrência desativada (ex: pagamento anual, contrato especial) são excluídos da contagem.

### Correção

**Arquivo: `src/pages/Cockpit.tsx`** (linha 65)

Alterar o filtro para usar o status do cliente:

```typescript
// De:
const ativos = clientesReceita.filter(c => c.mensalidadeAtiva);

// Para:
const ativos = clientesReceita.filter(c => c.statusCliente === "ativo");
```

O cálculo de MRR na linha 66 continuará correto pois soma `valorMensalidade` dos clientes ativos (que é o comportamento esperado — clientes ativos contribuem para o MRR independentemente do flag de recorrência).

### Arquivo Afetado
| Arquivo | Alteração |
|---|---|
| `src/pages/Cockpit.tsx` | Filtro de clientes ativos: `mensalidadeAtiva` → `statusCliente === "ativo"` |

