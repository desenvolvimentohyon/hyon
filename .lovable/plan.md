

## Plano: Custos puxam sistema e módulos do cliente automaticamente

### Contexto
A aba de Custos tem um campo manual "Sistema de custo" e "Custo módulos". O correto é puxar automaticamente o `system_name` do cliente e calcular o custo dos módulos ativos (da tabela `client_modules`), igual já é feito na aba Dados.

### Alterações

**`src/components/clientes/tabs/TabCustos.tsx`**

1. **Remover o campo "Sistema de custo"** (`cost_system_name`) — o sistema é o `cliente.system_name`
2. **Exibir o sistema do cliente** como leitura (`cliente.system_name`)
3. **Carregar módulos ativos** do cliente via `client_modules` + cruzar com `modulos` do `useParametros()` para calcular a soma dos custos (`valorCusto`)
4. **Custo módulos vira read-only** — calculado automaticamente pela soma dos `valorCusto` dos módulos vinculados
5. **Manter editável** apenas: "Custo ativo" (switch), "Outros custos" (manual) e "Observação de custos" (se houver)
6. **Remover campos** `cost_system_name` e `custoModulos` do formulário de edição (são calculados)
7. **Atualizar o `handleSave`** para não salvar `cost_system_name` nem `custoModulos` manualmente

### Resumo visual
- **Sistema**: leitura, puxado de `cliente.system_name`
- **Custo módulos**: leitura, soma automática dos `valorCusto` dos módulos ativos
- **Outros custos**: editável
- **Total e margem**: calculados automaticamente

