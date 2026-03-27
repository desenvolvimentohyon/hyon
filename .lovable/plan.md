

## Plano: Exibir módulos ao selecionar sistema no cadastro de cliente

### Objetivo
Quando o usuário seleciona um sistema no dialog "Novo Cliente" da tela `/receita`, exibir os módulos vinculados a esse sistema (e os globais) com checkboxes para seleção. Os módulos selecionados serão vinculados ao cliente após o cadastro via tabela `client_modules`.

### Como funciona
1. Ao selecionar um sistema, os módulos filtrados (`sistemaId === sistema.id` + globais) aparecem abaixo do campo "Sistema"
2. Cada módulo tem um checkbox, nome, e valores (venda/custo)
3. A mensalidade e o custo mensal são recalculados automaticamente como soma dos módulos selecionados
4. Ao cadastrar, os módulos selecionados são inseridos na tabela `client_modules`

### Alterações — 1 arquivo

**`src/pages/ClientesReceita.tsx`**

1. Adicionar estado `selectedModuleIds: Set<string>` no form
2. Quando `form.sistemaPrincipal` muda, filtrar módulos do `ParametrosContext` pelo `sistemaId` do sistema selecionado + módulos globais (`isGlobal`)
3. Renderizar lista de módulos com `Checkbox` abaixo do select de sistema
4. Ao marcar/desmarcar módulos, recalcular `valorMensalidade` (soma `valorVenda`) e `valorCustoMensal` (soma `valorCusto`)
5. No `handleCriar`, após inserir o cliente, inserir registros em `client_modules` para cada módulo selecionado
6. Limpar `selectedModuleIds` no `resetForm`

### Detalhes técnicos
- Os módulos são filtrados usando o `id` do sistema (não o nome) — buscar o sistema no array `sistemas` pelo nome selecionado para obter o `id`
- Insert em `client_modules`: `{ org_id, client_id, module_id }` para cada módulo
- O `addClienteReceita` do contexto não retorna o ID do cliente criado; será necessário ajustar para retornar o ID ou fazer o insert de módulos dentro do próprio contexto
- Alternativa mais simples: modificar `addClienteReceita` no `ReceitaContext.tsx` para aceitar um array opcional de `moduleIds` e inserir os `client_modules` na mesma operação

### Arquivos afetados
- `src/pages/ClientesReceita.tsx` — UI dos módulos no dialog
- `src/contexts/ReceitaContext.tsx` — aceitar `moduleIds` no `addClienteReceita` e inserir em `client_modules`

