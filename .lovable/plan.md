

## Plano: Adicionar botão de Inativar Cliente na tela de detalhe

### Contexto

A funcionalidade de inativar cliente **já existe** na listagem de clientes (`ClientesReceita.tsx`) via o menu de ações do card. Porém, ao abrir o detalhe de um cliente, não há opção para inativá-lo. O objetivo é adicionar essa ação também na página de detalhe.

### Alterações

#### 1. `src/components/clientes/ClienteDetalhe.tsx`
- Adicionar botão "Inativar" no header (ao lado do nome/badges), visível apenas quando o status do cliente **não** é `inativo` ou `cancelado`
- Adicionar um `AlertDialog` com campo de texto obrigatório para o motivo da inativação
- Ao confirmar, chamar `updateCliente` com `status: "inativo"`, `cancellation_reason`, `cancelled_at` e `recurrence_active: false`
- Após inativação, exibir toast de confirmação

#### 2. `src/hooks/useClienteDetalhe.ts`
- Verificar que o `ClienteFull` type já inclui `cancellation_reason` e `cancelled_at` (se não, adicioná-los)
- O `updateCliente` existente já aceita campos parciais, então será reutilizado

### Arquivos afetados

| Arquivo | Alteração |
|---|---|
| `src/components/clientes/ClienteDetalhe.tsx` | Botão + AlertDialog de inativação |
| `src/hooks/useClienteDetalhe.ts` | Adicionar campos `cancellation_reason` e `cancelled_at` ao type se necessário |

