

## Plano: Remover fluxo de pagamento e adicionar parcelas ao cartão de crédito

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/pages/PropostaInteligente.tsx` | Remover seletor "Fluxo de pagamento" e campo "Parcelas"; adicionar campo de parcelas quando forma de pagamento selecionada for "Cartão de Crédito" |
| `src/components/propostas/PropostaResumoLateral.tsx` | Atualizar exibição de parcelas para refletir a nova lógica |

### Detalhes

1. **Remover** o bloco `grid-cols-2` (linhas 491-508) que contém o seletor "Fluxo de pagamento" e o campo "Parcelas"
2. **Adicionar** campo de parcelas condicionalmente abaixo do seletor "Forma de pagamento (implantação)" — exibido apenas quando a forma selecionada contiver "cartão" ou "crédito" no nome
3. **Estado `fluxoImplantacao`**: derivar automaticamente — se forma = cartão e parcelas > 1 → "parcelado", senão → "a_vista"
4. **Resumo lateral**: manter a exibição de parcelas quando aplicável, usando a mesma lógica derivada

