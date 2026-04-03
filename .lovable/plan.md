

## Plano: Corrigir exibição de mensalidade parcial no Contas a Receber

### Problema
Quando uma mensalidade com cortesia parcial é gerada, o sistema define `status: "pago"` porque está dentro do fluxo de cortesia. Isso faz com que o título não apareça nos KPIs e filtros padrão do Contas a Receber (que destacam títulos "aberto" e "vencido"). O título existe no banco mas aparece como já liquidado.

### Solução
Alterar a lógica de geração para que cortesia parcial (com valor > 0) gere o título com `status: "aberto"` em vez de `"pago"`. Somente cortesia integral (valor = 0) deve ter `status: "pago"`.

### Alteração em `src/pages/financeiro/GerarMensalidades.tsx`

Na função `handleGenerate` (~linha 214), ajustar a definição de status:

```typescript
// Antes:
status: isCourtesy ? "pago" : "aberto",

// Depois:
status: (isCourtesy && !isPartial) ? "pago" : "aberto",
```

Isso garante que:
- **Cortesia integral** (R$ 0): status "pago" (comportamento atual mantido)
- **Cortesia parcial** (R$ X): status "aberto" → aparece no Contas a Receber como título a cobrar
- **Normal**: status "aberto" (sem mudança)

### Impacto
1 linha alterada em 1 arquivo. Sem alterações de banco. Os títulos parciais já gerados que precisam aparecer como "aberto" podem ser corrigidos manualmente ou via update no banco.

