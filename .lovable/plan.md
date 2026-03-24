

## Plano: Seção "Sobre o Sistema" com descrição do catálogo de sistemas

### Problema
A seção "Sobre o Sistema" no PDF usa `institutionalText` (texto institucional da empresa), que contém o CNPJ. O correto é mostrar a descrição do sistema cadastrada no catálogo de sistemas (`systems_catalog.description`).

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/lib/pdfGenerator.ts` | Adicionar campo `systemDescription` ao `PdfProposalData`; usar esse campo na seção "Sobre o Sistema" em vez de `company.institutionalText` |
| `src/lib/pdfGenerator.ts` | Em `gerarPDFPropostaComDados`, buscar a descrição do sistema no `systems_catalog` pelo nome do sistema e passá-la para o PDF |

### Detalhes técnicos

1. **Interface `PdfProposalData`**: Adicionar `systemDescription: string | null`
2. **Seção "Sobre o Sistema" (linha 136-141)**: Trocar `company.institutionalText` por `proposal.systemDescription`
3. **`gerarPDFPropostaComDados` (linha 351-408)**: Adicionar query ao `systems_catalog` filtrando por `name = proposta.sistema` e `org_id = orgId` para obter a `description`; passar como `systemDescription`
4. **Legacy `gerarPDFProposta`**: Passar `systemDescription: null` para manter compatibilidade

