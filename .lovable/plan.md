

## Plano: Adicionar filtro por tipo (Recorrente / Parcelado) na tabela de Contas a Pagar

### Alterações em `src/pages/financeiro/ContasPagar.tsx`

**1. Novo estado de filtro**
- Adicionar `filtroTipo` com valores: `"todos"`, `"recorrente"`, `"parcelado"`

**2. Novo Select de filtro na barra de filtros (linha ~134)**
- Adicionar um `Select` com opções: "Todos os tipos", "Recorrente", "Parcelado"
- Posicionar ao lado dos filtros existentes de status e origem

**3. Lógica de filtragem no `useMemo` (linha ~48-58)**
- Se `filtroTipo === "recorrente"`: filtrar descrições que contenham `(recorrente`
- Se `filtroTipo === "parcelado"`: filtrar descrições que contenham padrão `(X/Y)` mas **não** `(recorrente`

### Impacto
1 arquivo, ~10 linhas adicionadas.

