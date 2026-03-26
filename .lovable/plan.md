

## Plano: Adicionar tabela de lançamentos na Visão Geral

### O que será feito
Adicionar uma seção após os gráficos mostrando os lançamentos recentes (receitas e despesas) em uma tabela com filtro por tipo.

### Alteração

**`src/pages/financeiro/FinanceiroVisaoGeral.tsx`**

1. Adicionar state `filtroTipo` (todos / receber / pagar)
2. Criar um `useMemo` que filtra os últimos lançamentos (mais recentes primeiro, limitado a ~20), aplicando o filtro de tipo
3. Adicionar após os gráficos um novo `Card` com:
   - Header com título "Últimos Lançamentos" + Select para filtrar (Todos / Receitas / Despesas)
   - Tabela com colunas: Data, Descrição, Tipo (badge colorido), Categoria, Valor, Status (badge)
   - Receitas em verde, despesas em vermelho
   - Importar componentes `Table` e `Badge`

```text
┌─────────────────────────────────────────────────┐
│ Últimos Lançamentos          [Todos ▾]          │
├──────┬──────────────┬────────┬────────┬─────────┤
│ Data │ Descrição    │ Tipo   │ Valor  │ Status  │
│ 25/03│ Mensalidade  │Receita │ 1.200  │  Pago   │
│ 24/03│ Aluguel      │Despesa │   800  │ Aberto  │
│ ...  │              │        │        │         │
└──────┴──────────────┴────────┴────────┴─────────┘
```

### Detalhes técnicos
- Dados já disponíveis via `titulos` do `useFinanceiro()`
- Ordenação por `dataEmissao` decrescente
- Badge "Receita" com variante success, "Despesa" com variante destructive
- Status com cores: pago=verde, aberto=azul, vencido=vermelho, cancelado=cinza

