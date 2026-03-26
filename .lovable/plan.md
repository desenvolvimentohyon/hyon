

## Plano: Valor base calculado automaticamente pelos módulos

### Contexto
Atualmente o `monthly_value_base` é editável manualmente ou puxado do sistema. O usuário quer que o valor base seja **sempre a soma dos módulos ativos** do cliente, e o valor final seja o que o usuário estipular livremente.

### Alterações

**1. `src/components/clientes/tabs/TabDados.tsx`**
- No `toggleModule`, ao recalcular, setar `monthly_value_base` = soma dos módulos (venda), em vez de usar o valor do sistema
- Remover a lógica que soma `baseValue + sumVenda` para o `monthly_value_final`; o final não deve ser alterado automaticamente ao mudar módulos
- Na seleção de sistema (linha ~204), não setar mais `monthly_value_base` com `sys.valorVenda`

**2. `src/components/clientes/tabs/TabMensalidadeNew.tsx`**
- Tornar o campo "Valor Base (R$)" somente leitura (`readOnly` / `disabled` com `bg-muted/50`)
- Manter "Valor Final (R$)" editável normalmente

**3. `src/pages/CheckoutInterno.tsx`**
- Ajustar `baseValue` para usar a soma dos módulos do sistema selecionado (se aplicável), ou manter como está se o checkout não trabalha com módulos individuais

### Resumo
- Valor base = soma automática dos módulos ativos (read-only na UI)
- Valor final = definido manualmente pelo usuário
- Desconto calculado = `(1 - final/base) * 100`

