

## Plano: Remover campos da aba Contabilidade

### Editar: `src/components/clientes/tabs/TabContabilidade.tsx`

Remover os 4 campos da seção "Certificado & Regime":
- Nº Série Certificado (`cert_serial`)
- Emissor (`cert_issuer`)
- Data Reconhecimento (`cert_recognition_date`)
- CNAE Principal (`cnae_principal`)

Manter intactos: Vencimento do Certificado Digital e Regime da Empresa.

| Arquivo | Mudança |
|---------|------|
| `src/components/clientes/tabs/TabContabilidade.tsx` | Remover grid com os 4 campos (linhas ~87-92) |

