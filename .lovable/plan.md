

## Plano: Remover "Nome do Cliente" da aba Dados

### Contexto
A aba **TabDados.tsx** (a aba principal de edição) ainda exibe o campo "Nome do Cliente *" (campo `name`). Precisa ser removido, mantendo apenas "Nome Fantasia *" (obrigatório) e "Razão Social".

### Alterações

**`src/components/clientes/tabs/TabDados.tsx`**

1. **Linha 169**: Remover o campo `<div><Label>Nome do Cliente *</Label><Input value={v("name")} .../>` 
2. **Linha 170**: Alterar label de "Nome Fantasia" para "Nome Fantasia *" (obrigatório)
3. **No `onChange`**: Sempre que `trade_name` for alterado, sincronizar automaticamente `name` com o mesmo valor (para manter compatibilidade com o banco NOT NULL)

### Detalhes técnicos
- O campo `name` no banco continua existindo mas é preenchido silenciosamente com `trade_name`
- A busca por CNPJ já preenche `trade_name` e `legal_name` automaticamente -- isso continua funcionando
- Nenhuma alteração de banco necessária

