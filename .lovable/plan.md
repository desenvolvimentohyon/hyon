

## Plano: Redesign das subtabs de Parametrização + Aba Implantação

### 1. Redesign visual das subtabs (Configuracoes.tsx)

**Substituir** a `TabsList` padrão das subtabs por um **grid de cards navegáveis** (3 colunas no desktop, 1 no mobile). Cada card terá:
- Ícone colorido por categoria (usando as cores do domínio)
- Nome da subtab
- Descrição curta
- Hover com elevação e borda colorida
- Estado ativo com borda lateral colorida + background sutil

**Mapeamento de cores:**
| Subtab | Cor | Ícone |
|--------|-----|-------|
| Sistemas | blue (primary) | Monitor |
| Módulos | purple | Puzzle |
| Formas de Pagamento | emerald | CreditCard |
| Planos e Descontos | orange/amber | Tag |
| Propostas / CRM | indigo | FileText |
| Métricas | teal | BarChart3 |
| Labels | slate | Palette |
| Alertas | red | AlertTriangle |
| Implantação | violet | Rocket |
| Dados | sky | Database |

**Implementação:** Substituir o `<TabsList>` interno por um grid de botões customizados (`grid grid-cols-3 gap-3`) que controlam o `geralSubtab` via `onClick`. O conteúdo continua renderizado condicionalmente abaixo do grid.

### 2. Nova subtab: Implantação (dentro de Configurações Gerais)

Adicionar subtab "Implantação" com formulários para parametrizar custos:

**Seções dentro da subtab:**

**A. Custo por KM**
- Campo: Valor por KM (R$/km) — `CurrencyInput`
- Armazenado em `company_profile` (nova coluna `impl_cost_per_km`)

**B. Regiões de Implantação**
- Tabela CRUD: Nome da região, Valor Base, Taxa Adicional
- Nova tabela `deployment_regions` no banco

**C. Custo por Diária**
- Campo: Valor da diária (R$) — `CurrencyInput`
- Campo: Dias estimados padrão (number)
- Armazenado em `company_profile` (colunas `impl_daily_rate`, `impl_default_days`)

**D. Calculadora (preview)**
- Campos: Distância (km), Região (select), Dias
- Resultado: `(km × custo_km) + valor_base_região + taxa_região + (dias × diária)` = **Valor da Implantação**
- Read-only, para simular o cálculo antes de usar em propostas

### 3. Migração de banco

```sql
-- Colunas na company_profile
ALTER TABLE company_profile
  ADD COLUMN IF NOT EXISTS impl_cost_per_km numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impl_daily_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impl_default_days integer DEFAULT 1;

-- Nova tabela para regiões
CREATE TABLE deployment_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  base_value numeric NOT NULL DEFAULT 0,
  additional_fee numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE deployment_regions ENABLE ROW LEVEL SECURITY;
-- RLS policies (select/insert/update/delete por org)
```

### 4. Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/pages/Configuracoes.tsx` | Redesign completo das subtabs + adicionar subtab Implantação |
| Migração SQL | Criar colunas + tabela `deployment_regions` |

### Regras
- Nenhuma lógica existente alterada
- Todas as rotas mantidas
- Dados existentes preservados
- Apenas UI e nova parametrização de implantação

