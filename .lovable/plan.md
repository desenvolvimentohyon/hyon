

## Plano: Corrigir Cálculo Base do Sistema no Cadastro de Clientes

### Problemas Identificados

Após análise completa dos arquivos `TabDados.tsx`, `TabCusto.tsx`, `TabMensalidadeNew.tsx`, `TabModulos.tsx` e `ClienteDetalhe.tsx`, identifiquei **3 falhas** no fluxo de cálculo:

**1. Valores não recalculados ao carregar a página**
Em `TabDados.tsx` (linhas 84-98), ao carregar os módulos vinculados do cliente, o `useEffect` popula o `linkedModules` Map mas **nunca chama `recalcFromMap`**. Resultado: os campos `monthly_value_base` e `monthly_cost_value` exibem valores antigos do banco, mesmo que os preços dos módulos tenham mudado no catálogo.

**2. Toggle de módulo grava no banco mas totais dependem de "Salvar"**
Quando o usuário marca/desmarca um módulo (função `toggleModule`, linha 106), a operação INSERT/DELETE no `client_modules` é feita imediatamente no banco. Porém, os totais recalculados (`monthly_value_base`, `monthly_cost_value`) vão apenas para o `formData` local — só são persistidos se o usuário clicar "Salvar Alterações". Se ele navegar para outra aba ou fechar, os totais ficam dessincronizados.

**3. Mesmo problema na atualização de quantidade**
`updateModuleQuantity` (linha 127) atualiza `client_modules.quantity` no banco imediatamente, mas os totais recalculados ficam apenas no `formData`.

### Correções

**Arquivo: `src/components/clientes/tabs/TabDados.tsx`**

1. **Recalcular ao carregar módulos** — No `useEffect` que carrega `linkedModules` (linha 84), após popular o Map, chamar `recalcFromMap(map)` para sincronizar os valores exibidos com os preços atuais do catálogo.

2. **Auto-salvar totais no banco após toggle/quantidade** — Nas funções `toggleModule` e `updateModuleQuantity`, após recalcular os totais, fazer um `supabase.from("clients").update({ monthly_value_base, monthly_cost_value })` diretamente, garantindo que os valores no banco estejam sempre sincronizados com os módulos vinculados, independentemente de o usuário clicar "Salvar".

```text
Fluxo atual (quebrado):
  Toggle módulo → INSERT client_modules (DB) → recalcFromMap → formData (local apenas)
  Usuário sai sem salvar → clients.monthly_value_base = valor antigo

Fluxo corrigido:
  Toggle módulo → INSERT client_modules (DB) → recalcFromMap → formData (local)
                                                             → UPDATE clients (DB) ← NOVO
```

### Arquivo Afetado
| Arquivo | Alteração |
|---|---|
| `src/components/clientes/tabs/TabDados.tsx` | Recalc no load inicial + auto-save de totais no toggle/quantity |

