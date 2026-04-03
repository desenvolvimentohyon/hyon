

## Plano: Auditoria Geral — Dados da Empresa, Layout e Correções

### Problemas Identificados

#### 1. Dados Falsos / Hardcoded (Não pertencem à empresa)

**1a. Gráfico MRR com dados fictícios** (`FinanceiroVisaoGeral.tsx` linha 292)
O gráfico "Evolução MRR" usa uma fórmula fake: `kpis.mrr * (0.85 + i * 0.015)` — simula dados históricos que não existem. Precisa usar dados reais do banco.

**1b. Chave PIX hardcoded** (`ContasReceber.tsx` linha 75)
A mensagem de cobrança contém `financeiro@gestask.com` como chave PIX. Deveria buscar da configuração da empresa (`company_profile`).

**1c. `contaBancariaId: "cb1"` hardcoded** (`ContasReceber.tsx` linha 276)
O modal "Novo Título" usa um ID fixo `"cb1"` para conta bancária. Deveria usar a primeira conta real do usuário ou `null`.

#### 2. Correções de Layout / Console

**2a. Warning `CartesianGrid` ref** (console)
O Recharts emite warning sobre ref em `CartesianGrid`. Não causa erro funcional, mas pode ser silenciado.

#### 3. Verificações de Isolamento de Dados (OK)

Todas as tabelas principais usam RLS com `current_org_id()`. Todas as queries nos contextos (`AppContext`, `FinanceiroContext`, `ReceitaContext`, `PropostasContext`, `ParametrosContext`) são filtradas por `org_id` automaticamente via RLS. **O isolamento de dados está correto** — apenas dados da sua organização são retornados.

---

### Alterações Propostas

#### Arquivo 1: `src/pages/financeiro/FinanceiroVisaoGeral.tsx`
- **Gráfico MRR**: Substituir dados fake por cálculo real baseado nos títulos pagos do tipo "receber" com origem "mensalidade" por mês nos últimos 12 meses. Caso não haja dados suficientes, exibir apenas os meses com dados reais.

#### Arquivo 2: `src/pages/financeiro/ContasReceber.tsx`
- **Chave PIX**: Buscar da `company_profile` (campo `pix_key` da `company_bank_accounts` ou `email` do `company_profile`) via contexto ou query direta.
- **contaBancariaId**: Substituir `"cb1"` por `contasBancarias[0]?.id || null`.

---

### Detalhe Técnico

**Gráfico MRR Real** — lógica proposta:
```typescript
const mrrHistorico = useMemo(() => {
  const months: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = 0;
  }
  titulos.filter(t => t.tipo === "receber" && t.status === "pago" && t.origem === "mensalidade")
    .forEach(t => { if (months[t.competenciaMes] !== undefined) months[t.competenciaMes] += t.valorOriginal; });
  return Object.entries(months).map(([key, value]) => {
    const d = new Date(key + "-01");
    return { mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), mrr: value };
  });
}, [titulos]);
```

**Chave PIX dinâmica** — buscar do `company_bank_accounts` que é default:
```typescript
// Usar contasBancarias do FinanceiroContext ou buscar company_bank_accounts com pix_key
const pixKey = companyProfile?.email || "—";
```

### Impacto
3 correções em 2 arquivos. Sem alterações de banco. Melhora a integridade dos dados exibidos, removendo informações fictícias e hardcoded.

