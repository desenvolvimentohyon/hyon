

## Plano: Mostrar data de criação e validade no PDF da proposta

### Problema
Os campos "Data" e "Validade" na capa do PDF mostram "—" porque usam `sentAt` (data de envio) e `validUntil` (data de validade explícita), que frequentemente são `null`. Precisa usar a data de criação da proposta e calcular a validade baseada nos dias configurados.

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/lib/pdfGenerator.ts` | Adicionar campo `createdAt` ao `PdfProposalData`; usar `createdAt` como fallback para "Data"; calcular validade automaticamente quando `validUntil` for null |

### Detalhes

1. **Interface `PdfProposalData`**: Adicionar `createdAt: string` e `validityDays: number | null`
2. **Capa do PDF (linha 226-227)**:
   - "Data": usar `proposal.sentAt || proposal.createdAt` (sempre terá valor)
   - "Validade": usar `proposal.validUntil` ou calcular `createdAt + validityDays`
3. **`gerarPDFPropostaComDados` (linha 354-374)**: Passar `criadoEm` e `validadeDias`
4. **`gerarPDFProposta` (legada, linha 400)**: Passar `criadoEm` e `validadeDias` também

