

## Plano: Clicar em lançamento para ver/editar detalhes

### O que será feito
Adicionar um Dialog de detalhes/edição que abre ao clicar em uma linha da tabela de "Últimos Lançamentos" na Visão Geral.

### Alterações

**`src/pages/financeiro/FinanceiroVisaoGeral.tsx`**

1. Adicionar state `tituloSelecionado` (`TituloFinanceiro | null`)
2. Tornar cada `TableRow` clicável com `onClick={() => setTituloSelecionado(t)}` e `cursor-pointer`
3. Adicionar um `Dialog` de detalhes/edição com:
   - Campos editáveis: Descrição, Valor, Vencimento, Status, Observações
   - Campos somente-leitura: Tipo, Origem, Data Emissão, Competência
   - Botões "Cancelar" e "Salvar Alterações"
4. No "Salvar", chamar `updateTitulo(id, changes)` do contexto e fechar o dialog
5. Importar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `Label`, `Input`, `CurrencyInput`, `Button`, `Select` e `updateTitulo` do contexto

### Resultado visual

```text
┌──────────────────────────────────────┐
│ Detalhes do Lançamento               │
├──────────────────────────────────────┤
│ Tipo: Despesa    Origem: Outro       │
│ Emissão: 25/03   Competência: 2026-03│
│                                      │
│ Descrição: [___________________]     │
│ Valor:     [R$ 800,00__________]     │
│ Vencimento:[2026-03-30_________]     │
│ Status:    [Aberto ▾]                │
│ Observações: [_________________]     │
│                                      │
│          [Cancelar] [Salvar]         │
└──────────────────────────────────────┘
```

### Detalhes técnicos
- Reutiliza `updateTitulo` já existente no `FinanceiroContext`
- Estado local para campos editáveis, inicializados ao abrir o dialog
- Toast de sucesso ao salvar

