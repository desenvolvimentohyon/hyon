

# Plano: Adicionar seed data com 3 parceiros e clientes vinculados

## Objetivo
Incluir no edge function `seed-org` a criação de 3 parceiros com regras de comissão distintas, vincular clientes existentes a eles (via `ref_partner_id`), e gerar títulos financeiros de comissão (implantação + recorrente) para popular o sistema com dados representativos.

## Parceiros a criar

| Parceiro | Tipo | Impl. % | Recorr. % | Meses | Trigger |
|---|---|---|---|---|---|
| João Indicador | `implantacao_e_recorrente` | 15% | 5% | 12 | `on_invoice_paid` |
| Maria Parceira | `apenas_implantacao` | 10% | 0 | 0 | — |
| Tech Solutions | `implantacao_e_recorrente` | 12% | 3% | 0 (ilimitado) | `on_invoice_paid` |

## Clientes vinculados

- "Supermercado Bom Preço" → João Indicador (recorrente 5%, 12 meses)
- "Farmácia Vida Plena" → Maria Parceira (só implantação)
- "Auto Peças Nacional" → Tech Solutions (recorrente 3%, ilimitado)
- "Padaria Estrela Dourada" → João Indicador
- "Eletrônicos Tech" → Tech Solutions

## Comissões financeiras geradas (seed)

- 3 comissões de implantação (uma por parceiro, vinculadas às propostas aceitas PROP-0008 e PROP-0009)
- 4 comissões recorrentes pagas (2 para João, 2 para Tech Solutions) em competências passadas
- 2 comissões recorrentes abertas (mês atual)

## Alterações

### `supabase/functions/seed-org/index.ts`
1. **Force cleanup**: Adicionar `supabase.from("partners").delete().eq("org_id", orgId)` no bloco de limpeza
2. **Seção 9.5 (após clients)**: Inserir 3 parceiros na tabela `partners` e capturar IDs no `partnerMap`
3. **Update clients**: Atualizar 5 clientes com `ref_partner_id`, `ref_partner_recur_percent`, `ref_partner_recur_months`, `ref_partner_start_at`
4. **Seção 13 (proposals)**: Vincular PROP-0008 e PROP-0009 aos parceiros com `partner_id`, `partner_commission_implant_percent`, `partner_commission_implant_value`, `commission_implant_generated: true`
5. **Seção 14 (financial titles)**: Adicionar ~9 títulos de comissão com `origin: "comissao_parceiro"`, `commission_type`, `partner_id`, `reference_proposal_id`

Resultado: ao rodar o seed (force=true), o Dashboard, Parceiros e Contas a Pagar terão dados de comissão representativos desde o início.

