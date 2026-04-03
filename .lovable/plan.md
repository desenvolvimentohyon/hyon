

## Plano: Vincular Parcial à Cortesia

### Problema
Atualmente, cortesia e parcial são mutuamente exclusivos — ativar um desativa o outro. O usuário quer que ao selecionar cortesia, também seja possível informar um valor parcial (pagamento parcial com cortesia).

### Solução
Permitir que cortesia e parcial coexistam. Quando ambos estão ativos, o título é gerado como cortesia (status "pago", `isCourtesy: true`), mas com o valor parcial informado ao invés de R$ 0,00. Isso representa um "desconto cortesia" onde o cliente paga apenas parte do valor.

### Alterações em `src/pages/financeiro/GerarMensalidades.tsx`

1. **Remover exclusão mútua** — nas funções `toggleCourtesy` e `togglePartial`, não desativar o outro ao ativar um
2. **Expandir linha cortesia** — quando cortesia está ativa, mostrar o campo de motivo E um switch "Pagamento parcial?" com `CurrencyInput` (tudo na mesma área expandida)
3. **Remover coluna "Parcial" independente** — o parcial passa a ser uma sub-opção dentro da cortesia (simplifica a tabela)
4. **Atualizar `handleGenerate`** — quando cortesia + parcial ativos, gerar título com `valorOriginal = partialValue`, `status = "pago"`, `isCourtesy = true`, observação combinada
5. **Atualizar `totalSelected`** — cortesia com parcial soma o valor parcial (não zero)
6. **Badge de status** — mostrar "Cortesia Parcial" quando ambos estão ativos

### Lógica de geração atualizada
```
Se cortesia + parcial: valor = parcialValue, status = "pago", obs = "Cortesia parcial (integral: R$ X) - Motivo: Y"
Se cortesia sem parcial: valor = 0, status = "pago", obs = "Cortesia: Y"  
Se apenas parcial (removido — parcial agora vive dentro de cortesia)
Se normal: valor = mensalidade, status = "aberto"
```

### Impacto
1 arquivo editado. A coluna "Parcial" separada é removida e o campo de valor parcial fica dentro da área expandida da cortesia.

