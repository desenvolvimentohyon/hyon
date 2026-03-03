
# Plano: Corrigir bug no pagamento de comissão (ContasPagar)

## Problema Identificado
O pagamento da comissão R$ 225 **não foi salvo no banco** porque `contaBaixaId` tem valor padrão `"cb1"` (ID de seed antigo), mas as contas bancárias reais têm UUIDs válidos. A tentativa de gravar `bank_account_id: "cb1"` falha silenciosamente no Supabase.

## Correção

### Arquivo: `src/pages/financeiro/ContasPagar.tsx`
- Linha 24: Trocar `useState("cb1")` por `useState("")`
- Inicializar com a primeira conta bancária disponível via `useEffect`:
```tsx
useEffect(() => {
  if (contasBancarias.length > 0 && !contaBaixaId) {
    setContaBaixaId(contasBancarias[0].id);
  }
}, [contasBancarias]);
```

### Verificação adicional
- Checar se o mesmo bug existe em `ContasReceber.tsx` (provavelmente sim) e aplicar a mesma correção.

## Resultado
Após a correção, ao clicar "Confirmar Pagamento" na modal, o status do título será atualizado para "pago" no banco, e o Dashboard exibirá corretamente os valores de "Pago" e "A Pagar".
