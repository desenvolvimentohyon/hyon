

## Plano: Remover campo "Data Início" do contrato

### Contexto
Os campos `contract_signed_at` e `contract_start_at` representam a mesma informação. O usuário quer manter apenas "Data Assinatura" (`contract_signed_at`).

### Alterações

**1. `src/components/clientes/tabs/TabContrato.tsx`**
- Remover `contract_start_at` do estado `form` e do `handleSave`
- Atualizar `statusContrato` para usar apenas `contract_signed_at`
- Remover linha de exibição "Data início" no modo leitura
- Remover campo "Data Início" no modo edição
- No `handleSave`, copiar `contract_signed_at` para `contract_start_at` automaticamente (manter compatibilidade com o banco)

**2. `src/components/clientes/tabs/TabDados.tsx`**
- Remover o campo "Data Início" do formulário de dados

**3. `src/pages/PortalCliente.tsx`**
- Atualizar `diasComoCliente` para usar apenas `contract_signed_at` (já faz fallback, basta simplificar)

### Sem migração necessária
O campo `contract_start_at` permanece no banco para compatibilidade; apenas a UI deixa de exibi-lo, e ao salvar o contrato, o valor de `contract_signed_at` é espelhado em `contract_start_at`.

