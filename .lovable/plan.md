

## Plano: Adicionar opção "Cadastrar novo cliente" no select de Cliente (Nova Tarefa)

### Contexto atual
O select de Cliente na criação de tarefa já possui:
- "Avulsa" (sem cliente)
- "Cliente Avulso" (nome digitado manualmente)
- Lista de clientes cadastrados

### Mudança

**Editar: `src/pages/Tarefas.tsx`**

1. **Adicionar opção "Cadastrar novo cliente"** no `SelectContent` (value `"novo"`)

2. **Exibir formulário simplificado inline** quando `novoCliente === "novo"`:
   - Nome (obrigatório)
   - Telefone
   - Email
   - Cidade
   - Apenas esses 4 campos — sem sistema, perfil, CNPJ, etc.

3. **Ao criar a tarefa**: Se `novoCliente === "novo"`, chamar `addCliente` com os dados simplificados antes de criar a tarefa, e vincular o novo `clienteId` à tarefa

4. **Novos estados**: `novoClienteNome`, `novoClienteTelefone`, `novoClienteEmail`, `novoClienteCidade`

| Arquivo | Mudança |
|---------|------|
| `src/pages/Tarefas.tsx` | Adicionar opção + mini-formulário inline + lógica de criação |

