

## Plano: Módulos e Implantação no Checkout Interno

### Resumo
Expandir o wizard de checkout com 2 novas etapas: **Módulos** (após Sistema) e **Implantação** (após Plano). O valor base da mensalidade passa a ser a soma dos módulos selecionados (e não o `sale_value` do sistema). A implantação gera um título financeiro separado.

### Novo fluxo de etapas
```text
Sistema → Módulos → Plano → Implantação → Desconto → Cliente → Resumo
   0         1        2          3            4         5        6
```

### Alterações em `src/pages/CheckoutInterno.tsx`

**1. Etapa Módulos (step 1)**
- Ao selecionar um sistema, carregar módulos da tabela `system_modules` onde `system_id = selectedSystemId` OR `is_global = true`, filtrando `active = true`
- Exibir lista com nome e **valor de venda** (`sale_value`) — sem mostrar custo
- Cada módulo tem checkbox de seleção + campo de quantidade (default 1)
- Estado: `selectedModules: Map<string, number>` (moduleId → quantidade)
- O **valor base** passa a ser: `Σ (sale_value × quantidade)` dos módulos selecionados
- Pode prosseguir se ao menos 1 módulo estiver selecionado

**2. Etapa Implantação (step 3)**
- Carregar `deployment_regions` (ativas) e `company_profile` (campos `impl_cost_per_km`, `impl_daily_rate`)
- Exibir regiões como cards selecionáveis (radio — uma região por vez)
- Dois checkboxes: "Cobrar deslocamento (KM)" e "Cobrar diária"
- Se deslocamento marcado: campo de distância em KM → cálculo `distância × impl_cost_per_km`
- Se diária marcada: campo de dias → cálculo `dias × impl_daily_rate`
- Valor de implantação = `base_value da região` + deslocamento + diárias + `additional_fee`
- Botão "Pular" para vendas sem implantação
- Estado: `implValue: number` calculado automaticamente

**3. Ajustes no Resumo e Submit**
- Resumo exibe: módulos selecionados com quantidades, valor mensal, valor implantação, região
- No submit:
  - `monthly_value_base` e `monthly_value_final` = soma dos módulos (com desconto)
  - Criar registros em `client_modules` para cada módulo selecionado (com quantidade)
  - Se implantação > 0: criar `financial_title` extra com `origin = 'implantacao'`
  - Proposta inclui `implementation_value`

**4. Dados carregados no `loadData`**
- Adicionar queries: `system_modules`, `deployment_regions`, `company_profile`

### Arquivos Afetados
| Arquivo | Alteração |
|---|---|
| `src/pages/CheckoutInterno.tsx` | 2 novas etapas, lógica de módulos/implantação, submit atualizado |

Nenhuma mudança de banco necessária — todas as tabelas já existem.

