

## Plano: Auto-carregar módulos e calcular custo ao selecionar sistema

### Problema atual
Na aba Dados, ao selecionar um sistema:
1. Os módulos filtrados não incluem módulos globais
2. Ao marcar/desmarcar módulos, o custo não é recalculado automaticamente
3. O valor de custo dos módulos não reflete no `monthly_cost_value` nem no resumo financeiro em tempo real

### Mudanças

**Editar: `src/components/clientes/tabs/TabDados.tsx`**

1. **Incluir módulos globais** na lista de módulos exibidos — além dos módulos do sistema selecionado, mostrar também os módulos com `isGlobal === true`

2. **Recalcular custo ao trocar sistema**: Quando o usuário seleciona um sistema diferente, limpar os módulos vinculados do sistema anterior e carregar os do novo sistema. Atualizar o `monthly_value_base` com o valor de venda do sistema.

3. **Calcular totais em tempo real**: Exibir um resumo abaixo da lista de módulos com:
   - Total venda dos módulos marcados
   - Total custo dos módulos marcados
   - Atualizar `monthly_value_final` automaticamente (valor base sistema + soma venda módulos)

4. **Propagar custo para o formulário**: Ao marcar/desmarcar módulos, chamar `onChange({ monthly_cost_value: somaCustoModulos })` para que o valor reflita na aba Custo sem precisar salvar primeiro

| Arquivo | Mudança |
|---------|------|
| `src/components/clientes/tabs/TabDados.tsx` | Incluir globais, calcular custos em tempo real, propagar valores |

