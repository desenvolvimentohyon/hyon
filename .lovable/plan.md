

## Plano: Adicionar desconto manual na mensalidade da proposta

### Contexto
O cálculo atual da mensalidade já é dinâmico (sistema + módulos selecionados). O valor de R$600 vem do cadastro do sistema nos parâmetros. O que falta é a possibilidade de aplicar um **desconto manual** na mensalidade, além do desconto automático do plano.

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/pages/PropostaInteligente.tsx` | Adicionar campo de desconto manual (%) na seção "Plano e Desconto" e incluí-lo no cálculo |
| `src/components/propostas/PropostaResumoLateral.tsx` | Exibir linha do desconto manual no resumo lateral |

### Detalhes

1. **Novo estado `descontoManualPercent`** (number, default 0) no formulário
2. **Campo numérico** na seção "Plano e Desconto" com label "Desconto adicional (%)" — permite o usuário inserir um percentual de desconto manual
3. **Cálculo atualizado**: `mensalidadeFinal = mensalidadeBase - descontoPlano - descontoManual`
4. **Resumo lateral**: exibir linha separada para desconto manual quando > 0
5. **Interface `ResumoData`**: adicionar `descontoManualPercent` e `descontoManualValor`

