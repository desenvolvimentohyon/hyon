

## Plano: Limitar altura do select de Cliente e adicionar "Cadastrar novo cliente" na Nova Proposta

### Editar: `src/pages/PropostaInteligente.tsx`

1. **Limitar altura do `SelectContent`** do cliente adicionando `className="max-h-[140px] overflow-y-auto"` — exibe ~3 itens com scroll
2. **Adicionar opção "➕ Cadastrar novo cliente"** como primeiro item do select (value `"novo"`)
3. **Adicionar estados** para mini-formulário: `novoClienteNome`, `novoClienteTelefone`, `novoClienteEmail`, `novoClienteCidade`
4. **Exibir formulário simplificado inline** quando `clienteId === "novo"` com 4 campos: Nome (obrigatório), Telefone, Email, Cidade
5. **Na submissão da proposta**: se `clienteId === "novo"`, chamar `addCliente` com dados simplificados, vincular o novo ID à proposta

### Detalhes técnicos

| Arquivo | Mudança |
|---------|------|
| `src/pages/PropostaInteligente.tsx` | Adicionar `max-h` no SelectContent, opção "novo cliente", mini-formulário inline e lógica de criação |

Mesmo padrão já implementado no módulo de Tarefas.

