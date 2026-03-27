

## Plano: Usar catálogo dinâmico de sistemas nos gráficos

### Problema
Os gráficos de sistemas estão hardcoded com apenas 5 sistemas fixos (`PDV+`, `LinkPro`, `Torge`, `Emissor Fiscal`, `Hyon Hospede`). Se o usuário cadastra novos sistemas no catálogo de parâmetros, eles não aparecem nos gráficos.

### Causa raiz
O tipo `SistemaPrincipal` e a paleta `RECEITA_COLORS.sistemas` são estáticos. Todos os gráficos usam listas hardcoded em vez de consultar o catálogo dinâmico de `useParametros().sistemas`.

### Correção — 6 arquivos

**1. `src/types/receita.ts`**
- Mudar `SistemaPrincipal` de union type fixo para `string` (aceitar qualquer sistema do catálogo)
- Remover o mapa fixo `RECEITA_COLORS.sistemas` e substituir por uma função `getSystemColor(name: string)` que gera cores dinâmicas a partir de uma paleta

**2. `src/pages/Dashboard.tsx`**
- Importar `useParametros` e usar `sistemas.filter(s => s.ativo).map(s => s.nome)` em vez da lista hardcoded
- Usar `getSystemColor()` para cores dinâmicas

**3. `src/pages/Receita.tsx`**
- Mesma correção: substituir lista hardcoded por `useParametros().sistemas`

**4. `src/pages/financeiro/ConfiguracoesFinanceiras.tsx`**
- Substituir array fixo de sistemas pelo catálogo dinâmico

**5. `src/lib/pdfRelatorioReceita.ts`**
- Aceitar lista de sistemas como parâmetro em vez de hardcoded (ou extrair nomes únicos dos clientes)

**6. `src/contexts/ReceitaContext.tsx`**
- O mapper `dbToClienteReceita` já lê `r.system_name` — sem alteração necessária no mapper, mas o fallback `"PDV+"` pode ser ajustado para `""` ou mantido

### Detalhes técnicos
- Paleta dinâmica: usar um array de cores predefinidas e atribuir por índice (`sistemas[i].nome → colors[i % colors.length]`)
- O tipo `SistemaPrincipal` passando a ser `string` não quebra nenhuma lógica existente, apenas remove a restrição
- Os gráficos passarão a mostrar todos os sistemas ativos do catálogo automaticamente

