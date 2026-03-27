

## Plano: Corrigir nome do cliente não exibido após cadastro

### Problema
Ao cadastrar um cliente pela tela de "Clientes e Receita" (`/receita`), o campo `trade_name` não é preenchido no banco — apenas o campo `name`. Quando o usuário entra no detalhe do cliente, o campo "Nome Fantasia" aparece vazio porque o formulário exibe `trade_name`, que está `null`.

### Causa raiz
A função `addClienteReceita` em `ReceitaContext.tsx` insere apenas `name: c.nome`, sem definir `trade_name`.

### Correção — 1 arquivo

**`src/contexts/ReceitaContext.tsx`** (linha ~96)
- Adicionar `trade_name: c.nome` no objeto de insert, ao lado de `name: c.nome`
- Isso garante que o nome inserido fique disponível tanto no campo `name` quanto no `trade_name`, que é o que o formulário de detalhe exibe

### Impacto
- Correção simples de 1 linha
- Clientes já existentes com `trade_name` vazio continuarão sem nome fantasia até serem editados manualmente (comportamento esperado)

