

## Plano: Corrigir link público da proposta que não abre

### Problema
O campo `acceptance_link` no banco contém o valor `/aceite/PROP-2026-0001`. No `PropostasContext.tsx` (linha 24), o `linkAceite` é construído como:
```
`/proposta/${r.acceptance_link || r.proposal_number}`
```
Isso gera o link `/proposta//aceite/PROP-2026-0001` — uma URL inválida que não corresponde à rota `/proposta/:token`.

Quando o usuário copia o link ou envia via WhatsApp, a URL quebrada não bate com a rota do React Router, e a página `PropostaPublica` recebe um token errado (contendo `/aceite/PROP-...`), fazendo a edge function retornar 404.

### Alteração

| Arquivo | Mudança |
|---------|------|
| `src/contexts/PropostasContext.tsx` | Corrigir construção do `linkAceite` para usar apenas o `proposal_number` como token |

### Detalhe técnico

Linha 24 — trocar:
```typescript
linkAceite: `/proposta/${r.acceptance_link || r.proposal_number}`,
```
por:
```typescript
linkAceite: `/proposta/${r.proposal_number}`,
```

O `proposal_number` (ex: `PROP-2026-0001`) é o token correto que a edge function `public-proposal` já busca via `.eq("proposal_number", token)`. Isso garante que o link gerado (`/proposta/PROP-2026-0001`) funcione corretamente com a rota e a função.

