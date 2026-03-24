

## Plano: Limpar rodapé e usar cores do company_profile no PDF

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/lib/pdfGenerator.ts` | 1. Remover CNPJ, email e telefone do rodapé (linhas 315-317). 2. Substituir cores hardcoded (dark/green) pelas cores `primaryColor` e `secondaryColor` do `company_profile`. |

### Detalhes

1. **Rodapé (linha 313-318)**: Remover as 3 linhas que adicionam CNPJ, phone e email. Manter apenas `© {year} {companyName} — Todos os direitos reservados`.

2. **Cores dinâmicas**: Atualmente o PDF usa cores fixas (`#4ade80` verde neon, `#0f172a` dark). Substituir por:
   - `green` → `company.primaryColor` (cor primária configurada)
   - `greenMuted` → versão com opacidade da primaryColor
   - `dark` → manter `#0f172a` como fundo base (dark premium)
   - `greenDim` / `greenBorder` → derivar de `primaryColor` com rgba

   Isso fará o PDF respeitar as cores configuradas no perfil da empresa.

