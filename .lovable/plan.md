

## Plano: Remover opções "Avulsa" e "Cliente Avulso" do select de Cliente na criação de tarefa

### Editar: `src/pages/Tarefas.tsx`

1. **Remover `<SelectItem value="null">Avulsa</SelectItem>`** (linha 482)
2. **Remover `<SelectItem value="avulso">Cliente Avulso</SelectItem>`** (linha 483)
3. **Remover bloco condicional do input de cliente avulso** (linhas 488-490) — o `{novoCliente === "avulso" && ...}`
4. **Ajustar valor default do `novoCliente`** para `""` ou primeiro cliente, para que o select não fique com valor inválido

| Arquivo | Mudança |
|---------|------|
| `src/pages/Tarefas.tsx` | Remover as 2 opções e o input condicional de cliente avulso |

