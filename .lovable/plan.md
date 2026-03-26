

## Plano: Remover campo "Nome" da aba de identificação

### Contexto
O campo `name` na tabela `clients` é NOT NULL. Para removê-lo da UI sem quebrar o banco, ao salvar vamos preencher `name` automaticamente com o valor de `trade_name` (Nome Fantasia), que passa a ser obrigatório.

### Alterações

**`src/components/clientes/tabs/TabGeral.tsx`**

1. **Estado do form**: remover `name` do state; tornar `trade_name` obrigatório
2. **Modo leitura**: remover a linha `Nome:` do grid de exibição
3. **Modo edição**: remover o campo `Nome *`; alterar label de `Nome Fantasia` para `Nome Fantasia *` (obrigatório)
4. **handleSave**: setar `name: form.trade_name` automaticamente (para manter compatibilidade com o banco que exige `name` NOT NULL)

### Detalhes técnicos
- O campo `name` do banco continua existindo, mas é preenchido silenciosamente com `trade_name`
- Validação: impedir salvar se `trade_name` estiver vazio
- Nenhuma alteração de banco necessária

