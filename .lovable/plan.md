

## Plano: Adicionar "Cliente Avulso" na criação de tarefas

### Resumo
Permitir que o usuário digite manualmente o nome de um cliente que não está cadastrado no sistema (cliente avulso), para fins de verificação/consulta. O campo aparece quando o usuário seleciona a opção "Cliente Avulso" no seletor de clientes da tarefa.

### O que muda

No formulário de criação de tarefas e na exibição, além de "Avulsa" (sem cliente), haverá a opção "Cliente Avulso" que exibe um campo de texto para digitar o nome livremente.

### 1. Editar: `src/types/index.ts`
- Adicionar campo opcional `nomeClienteAvulso?: string` na interface `Tarefa`

### 2. Editar: `src/pages/Tarefas.tsx`
- Adicionar estado `nomeClienteAvulso`
- No Select de Cliente, adicionar opção "Cliente Avulso" (value `"avulso"`)
- Quando `novoCliente === "avulso"`, exibir um Input de texto para digitar o nome
- No `handleCriar`, salvar `clienteId: null` e `nomeClienteAvulso: nomeClienteAvulso`
- Na tabela/kanban, exibir `nomeClienteAvulso` quando não há `clienteId` mas existe o nome avulso

### 3. Editar: `src/contexts/AppContext.tsx`
- Garantir que `addTarefa` aceita e propaga o campo `nomeClienteAvulso`

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/types/index.ts` | Novo campo `nomeClienteAvulso` |
| `src/pages/Tarefas.tsx` | Opção "Cliente Avulso" + campo de texto |
| `src/contexts/AppContext.tsx` | Propagar novo campo |

