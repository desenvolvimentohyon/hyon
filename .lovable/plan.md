

## Plano: Corrigir perda de módulos ao trocar o sistema do cliente

### Problema

Quando o usuário troca o sistema do cliente (campo "Sistema" na aba Dados), a lista de módulos exibida muda para os módulos do novo sistema. Os módulos do sistema anterior continuam salvos no banco (`client_modules`), mas ficam invisíveis na UI — e os módulos do novo sistema aparecem todos desmarcados. Não há lógica de limpeza dos módulos antigos nem recálculo dos totais.

### Solução

Ao trocar o sistema, adicionar uma confirmação e limpar os módulos vinculados do sistema anterior, resetando os totais.

### Alteração

**`src/components/clientes/tabs/TabDados.tsx`**

1. No `onValueChange` do Select de Sistema (linha 254), ao trocar de sistema:
   - Exibir um `AlertDialog` de confirmação: _"Trocar o sistema removerá os módulos vinculados ao sistema atual. Deseja continuar?"_
   - Se confirmado:
     - Deletar todos os registros de `client_modules` do cliente no banco
     - Limpar o state `linkedModules` (Map vazio)
     - Recalcular totais para zero (`monthly_value_base: 0, monthly_cost_value: 0`)
     - Setar o novo `system_name`
   - Se cancelado: não alterar nada

2. Adicionar state para controlar o dialog de confirmação (`pendingSystem`, `showSystemChangeDialog`)

### Arquivo afetado
1. `src/components/clientes/tabs/TabDados.tsx`

