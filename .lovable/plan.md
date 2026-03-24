

## Plano: Redesign do PDF para tema claro com layout da screenshot

### Problema
O PDF atual usa tema escuro (dark). O usuário quer o layout mostrado na screenshot: fundo branco, cabeçalho colorido com dados da empresa, título "PROPOSTA COMERCIAL" centralizado, seções com ícones (Dados do Cliente, Sistema, Módulos, Investimento), cards com bordas leves.

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/lib/pdfGenerator.ts` | Redesenhar completamente o HTML/CSS do PDF para tema claro conforme screenshot |

### Detalhes

1. **Tema claro**: Fundo `#fff`, texto `#1e293b`, substituir todas as cores dark por claras
2. **Cabeçalho**: Barra com `background: primaryColor` (verde/azul), logo + nome à esquerda, CNPJ/telefone/endereço à direita em texto branco
3. **Título centralizado**: "PROPOSTA COMERCIAL" em negrito grande, com metadados (Nº, Data, Validade) abaixo em linha
4. **Seções com ícones**: Cada seção (Dados do Cliente, Sistema, Módulos Incluídos, Investimento, etc.) com ícone colorido circular + título em uppercase bold, separador horizontal
5. **Cards de dados**: Fundo branco com borda `#e2e8f0`, cantos arredondados, labels em cinza claro uppercase e valores em preto bold
6. **Sistema**: Badge escuro com ícone e nome do sistema
7. **Módulos**: Cards com borda lateral colorida, ícone, nome e valor em verde
8. **Investimento**: Grid 2 colunas (Mensalidade / Implantação) com valores destacados
9. **Manter**: Footer, assinatura, condições, próximos passos — apenas adaptar para tema claro

