

## Plano: Exibir Custo do Sistema no Card de Clientes

### Problema
Na listagem de clientes (`/clientes`), cada card mostra o valor da mensalidade e a margem, mas **não exibe o custo** (`valorCustoMensal`). Conforme o screenshot, a informação de custo está ausente entre a mensalidade e a margem.

### Correção

**Arquivo: `src/pages/ClientesReceita.tsx`** (linhas 314-319)

Adicionar o valor de custo no `extraInfo` do `ClienteCard`, entre a mensalidade e a margem:

```
De:
  <span>R$ {valorMensalidade}</span>
  <span>Margem: R$ {margem}</span>

Para:
  <span>R$ {valorMensalidade}</span>
  <span style custo>Custo: R$ {valorCustoMensal}</span>
  <span>Margem: R$ {margem}</span>
```

O custo será exibido com cor diferenciada (ex: `text-orange-400`) para distinguir visualmente dos demais valores. Apenas clientes com `custoAtivo` exibirão o valor de custo.

### Arquivo Afetado
| Arquivo | Alteração |
|---|---|
| `src/pages/ClientesReceita.tsx` | Adicionar exibição de `valorCustoMensal` no `extraInfo` do card |

