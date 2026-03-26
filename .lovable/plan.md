

## Plano: Últimos Lançamentos em formato de gráfico

### O que será feito
Adicionar um gráfico de barras acima da tabela existente na seção "Últimos Lançamentos", mostrando os lançamentos agrupados por dia com barras de receita e despesa empilhadas/lado a lado.

### Alterações

**`src/pages/financeiro/FinanceiroVisaoGeral.tsx`**

1. Criar um `useMemo` chamado `lancamentosPorDia` que agrupa os `lancamentosRecentes` por data de emissão, somando valores de receita e despesa por dia (últimos 30 dias)
2. Adicionar um gráfico `BarChart` (recharts, já importado) dentro do Card de "Últimos Lançamentos", entre o header e a tabela
3. O gráfico terá duas barras por dia: **Receitas** (azul) e **Despesas** (vermelho), usando as cores do `FINANCEIRO_COLORS.raw`
4. O eixo X mostra as datas formatadas (dd/MM), o eixo Y mostra valores em R$
5. Incluir Tooltip com formatação em moeda
6. A tabela paginada continua abaixo do gráfico, mantendo toda funcionalidade existente (paginação, clique para editar)

### Resultado visual

```text
┌──────────────────────────────────────────────┐
│ Últimos Lançamentos              [Todos ▾]   │
├──────────────────────────────────────────────┤
│  ██                                          │
│  ██ ▓▓    ██         ██                      │
│  ██ ▓▓ ██ ██    ▓▓   ██ ▓▓                   │
│  ── ── ── ── ── ── ── ── ──                  │
│  01  02  03  04  05  06  07                  │
│         ■ Receitas  ■ Despesas               │
├──────────────────────────────────────────────┤
│ Data │ Descrição │ Tipo │ Valor │ Status     │
│ ...  │ ...       │ ...  │ ...   │ ...        │
├──────────────────────────────────────────────┤
│        ← Anterior  Pág 1 de 5  Próximo →     │
└──────────────────────────────────────────────┘
```

### Detalhes técnicos
- Reutiliza `lancamentosRecentes` já filtrado pelo `filtroTipo`
- Agrupa por data, soma receitas e despesas separadamente
- O filtro "Todos/Receitas/Despesas" afeta tanto o gráfico quanto a tabela
- Sem novas dependências

