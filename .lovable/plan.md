

## Plano: Criar módulo inline na aba Dados do cliente

### Resumo
Quando o sistema selecionado não possui módulos cadastrados, exibir uma mensagem com botão para criar um módulo diretamente ali, sem precisar navegar até Configurações.

### Mudança

**Arquivo: `src/components/clientes/tabs/TabDados.tsx`**

1. Alterar a condição `systemModules.length > 0` para exibir a seção sempre que houver um sistema selecionado (`currentSystem`)
2. Quando `systemModules.length === 0`, mostrar um empty state: "Nenhum módulo cadastrado para {sistema}." com botão "+ Novo Módulo"
3. Adicionar um Dialog inline com campos: Nome, Descrição, Valor Custo, Valor Venda (mesmo formato do modal em Configurações)
4. Ao salvar, chamar `addModulo` do `useParametros()` passando o `sistemaId` do sistema atual, e então o `fetchAll` recarrega a lista automaticamente

### Detalhes técnicos

- Novo state: `showNewModuleDialog` (boolean) + `newModuleForm` (nome, descricao, valorCusto, valorVenda)
- Importar `addModulo` de `useParametros()`
- O módulo é criado com `ativo: true` e `sistemaId: currentSystem.id`
- Após salvar, os checkboxes aparecem automaticamente (o contexto faz `fetchAll`)

### Arquivos editados
| Arquivo | Mudança |
|---------|---------|
| `src/components/clientes/tabs/TabDados.tsx` | Adicionar empty state + dialog de criação rápida de módulo |

