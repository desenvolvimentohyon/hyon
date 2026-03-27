

## Plano: Adicionar quantidade por módulo na aba de clientes

### Objetivo
Ao selecionar um módulo na aba Dados do cliente, permitir definir a quantidade (ex: 2 licenças do mesmo módulo). Os cálculos de venda e custo devem multiplicar pelo quantidade.

### Alterações

**1. Migração — Adicionar coluna `quantity` à tabela `client_modules`**
```sql
ALTER TABLE public.client_modules ADD COLUMN quantity integer NOT NULL DEFAULT 1;
```

**2. `src/components/clientes/tabs/TabDados.tsx`**
- Trocar o estado `linkedModuleIds: string[]` por `linkedModules: Map<string, number>` (moduleId → quantity)
- Ao carregar, buscar `module_id, quantity` do `client_modules`
- Ao marcar um módulo, inserir com `quantity: 1`; ao desmarcar, deletar
- Adicionar um input numérico (tipo stepper/number, min=1) ao lado de cada módulo marcado para ajustar a quantidade
- Ao alterar a quantidade, fazer `update` no `client_modules` com o novo valor
- Recalcular totais: `sum(valorVenda * quantity)` e `sum(valorCusto * quantity)`
- Na linha de resumo, mostrar total de módulos considerando quantidades

**3. `src/components/clientes/tabs/TabModulos.tsx`** — Exibir quantidade
- Buscar `quantity` junto com `module_id` do `client_modules`
- Exibir a quantidade ao lado do nome do módulo (ex: "×2")
- Multiplicar valores de venda/custo pela quantidade nos totais

**4. `src/components/clientes/tabs/TabCusto.tsx`** — Buscar com quantidade
- Ajustar o fetch para incluir `quantity` e multiplicar `cost_value * quantity` no cálculo de custo dos módulos

### Detalhes técnicos

```text
client_modules (atual):
  id, org_id, client_id, module_id

client_modules (novo):
  id, org_id, client_id, module_id, quantity (int, default 1)

UI do módulo (TabDados):
  [✓] Módulo X          [1 ▲▼]  R$ 50,00
  [✓] Módulo Y          [3 ▲▼]  R$ 150,00 (3×50)
  [ ] Módulo Z                    R$ 30,00

Totais recalculados com quantidade:
  Total Venda = Σ(valorVenda × quantity)
  Total Custo = Σ(valorCusto × quantity)
```

