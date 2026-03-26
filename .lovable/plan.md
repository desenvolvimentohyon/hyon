

## Plano: Adicionar paginação na tabela de lançamentos

### O que será feito
Substituir o limite fixo de 20 registros por paginação completa, permitindo navegar por todos os lançamentos.

### Alterações

**`src/pages/financeiro/FinanceiroVisaoGeral.tsx`**

1. Remover o `.slice(0, 20)` do `lancamentosRecentes` — retornar todos os registros filtrados/ordenados
2. Adicionar state `paginaAtual` (inicia em 1), constante `POR_PAGINA = 10`
3. Criar `useMemo` com os itens paginados: `lancamentosRecentes.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)`
4. Calcular `totalPaginas = Math.ceil(lancamentosRecentes.length / POR_PAGINA)`
5. Resetar `paginaAtual` para 1 quando `filtroTipo` mudar (via `useEffect` ou incluindo no `onValueChange`)
6. Adicionar abaixo da tabela os componentes `Pagination` com Previous/Next e indicador "Página X de Y — N registros"
7. Importar `Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext` de `@/components/ui/pagination`

### Resultado visual

```text
┌──────────────────────────────────────────────┐
│ Tabela com 10 registros por página           │
├──────────────────────────────────────────────┤
│           ← Anterior  Página 1 de 5  Próximo → │
│                   50 registros               │
└──────────────────────────────────────────────┘
```

