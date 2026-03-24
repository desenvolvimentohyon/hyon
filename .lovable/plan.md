

## Plano: Não calcular implantação até o usuário preencher os campos

### Problema
O valor de R$ 600 que aparece imediatamente vem do cálculo `dias × impl_daily_rate` (1 × 600 = R$ 600). Como `dias` inicia com o valor padrão da empresa e a taxa diária é R$ 600, o total aparece antes mesmo do usuário configurar algo.

### Solução
Iniciar `dias` com **0** em vez do valor padrão, para que o cálculo de implantação comece zerado. O valor padrão da empresa será usado apenas como sugestão/placeholder.

### Editar: `src/pages/PropostaInteligente.tsx`

1. **Alterar o estado inicial de `dias`** de `1` para `0` (linha 69)
2. **Remover a atribuição do `setDias` no `useEffect`** que carrega `impl_default_days` (linha 94) — ou manter apenas como placeholder/sugestão
3. **Opcionalmente**: mostrar o `impl_default_days` como placeholder no input de dias para que o usuário saiba o padrão

| Arquivo | Mudança |
|---------|------|
| `src/pages/PropostaInteligente.tsx` | Iniciar `dias` com 0 e não auto-preencher com valor padrão da empresa |

