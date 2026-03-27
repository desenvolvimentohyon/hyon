

## Plano: Calcular data de reajuste automaticamente (assinatura + 12 meses)

### Objetivo
O campo "Data Base Reajuste" deve ser calculado automaticamente como 12 meses após a "Data Assinatura" do contrato, em vez de ser preenchido manualmente.

### Alterações

**1. `src/components/clientes/tabs/TabDados.tsx`**
- Ao alterar `contract_signed_at`, calcular automaticamente `adjustment_base_date` = data assinatura + 12 meses
- Tornar o campo "Data Base Reajuste" somente leitura (read-only), mostrando o valor calculado
- Se `contract_signed_at` estiver vazio, `adjustment_base_date` fica vazio também

**2. `src/components/clientes/tabs/TabContrato.tsx`**
- Aplicar a mesma lógica: ao editar a data de assinatura, recalcular a data de reajuste automaticamente
- Tornar o campo de data de reajuste read-only com visual de campo calculado

### Lógica de cálculo
```text
adjustment_base_date = addMonths(contract_signed_at, 12)

Exemplo:
  Assinatura: 2025-03-15
  Reajuste:   2026-03-15 (calculado automaticamente)
```

### Detalhes técnicos
- Usar `date-fns/addMonths` (já presente no projeto) para o cálculo
- O campo calculado terá aparência de campo desabilitado (`disabled` ou `readOnly` com estilo `bg-muted`)
- Ao salvar, o valor calculado será persistido normalmente em `adjustment_base_date` no banco

