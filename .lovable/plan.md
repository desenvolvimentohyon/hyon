

## Plano: Vincular tarefa ao sistema do cliente automaticamente

### Resumo
Ao selecionar um cliente no modal de criação de tarefa, detectar o `system_name` do cliente e exibir uma sugestão opcional para vincular o sistema à tarefa.

### Mudança

**Arquivo: `src/pages/Tarefas.tsx`**

1. No modal "Nova Tarefa", ao alterar o `novoCliente`, buscar o `system_name` do cliente selecionado via `clientes.find()`
2. Se o cliente tiver `system_name` preenchido, exibir um banner informativo abaixo do select de cliente:
   - Texto: "Este cliente usa o sistema **{nome}**. Deseja vincular à tarefa?"
   - Botão "Vincular" que seta `sistemaRelacionado` no form state
   - Se já vinculado, mostrar badge com o nome do sistema e botão para desvincular
3. Adicionar state `novoSistema` (string | undefined) ao form
4. Passar `sistemaRelacionado: novoSistema` no `addTarefa()`
5. Resetar `novoSistema` ao trocar de cliente ou fechar o modal

### Detalhes técnicos

- O campo `system_name` do cliente já está disponível via contexto de Receita, mas no `AppContext` os clientes não carregam esse campo. Verificar se `clientes` no `useApp()` inclui `system_name`.
- Se não incluir, usar query direta ou buscar do array de clientes do ReceitaContext.
- O `sistemaRelacionado` é salvo como `sistema_relacionado` na tabela `tasks` e já é suportado pelo `tarefaToDb`.

### Arquivos editados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/Tarefas.tsx` | Adicionar detecção do sistema do cliente + banner de vínculo opcional no modal de criação |

