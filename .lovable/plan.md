

## Plano: Melhoria Severa de Fluidez do Sistema

### Diagnóstico dos Gargalos

Após análise detalhada dos 6 contexts e da arquitetura, identifiquei **5 problemas críticos** que causam lentidão:

1. **Toda mutação dispara `fetchAll()` que re-busca TUDO** — criar uma tarefa re-busca clientes, perfis, tarefas, comentários e histórico inteiro
2. **Tabela `clients` é carregada 2x simultaneamente** — `AppContext` e `ReceitaContext` fazem fetch de `clients.*` na inicialização
3. **`setLoading(true)` em toda operação** — PropostasContext e FinanceiroContext mostram skeleton a cada fetchAll, mesmo em mutations
4. **Nenhuma página tem lazy loading** — todas as 40+ páginas são importadas eagerly no App.tsx
5. **Valor do contexto recriado a cada render** — nenhum `useMemo` no objeto `value` dos providers, causando re-renders em cascata

### Correções

---

**1. App.tsx — Lazy loading de TODAS as páginas**

Converter todas as importações de páginas para `React.lazy()` com `Suspense`. Isso reduz o bundle inicial de ~40 páginas para carregar apenas a página atual.

```typescript
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
// ... todas as demais
```

Envolver as `Routes` em `<Suspense fallback={<PageSkeleton />}>`.

---

**2. AppContext — Optimistic updates em vez de fetchAll()**

Em cada mutation (`addTarefa`, `updateTarefa`, `deleteTarefa`, `startTimer`, `stopTimer`, `addCliente`, `updateCliente`, `deleteCliente`):
- Atualizar o state local imediatamente (optimistic)
- Fazer o write no banco em background
- Remover a chamada `fetchAll()` após cada operação
- Manter `fetchAll()` apenas na inicialização

Exemplo para `deleteTarefa`:
```typescript
const deleteTarefa = useCallback(async (id: string) => {
  setTarefas(prev => prev.filter(t => t.id !== id)); // instant
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) { toast.error("Erro"); fetchAll(); } // rollback on error
}, [fetchAll]);
```

---

**3. AppContext — `useMemo` no value do provider**

Envolver o objeto `value` em `useMemo` para evitar re-renders desnecessários em todos os consumidores:

```typescript
const value = useMemo(() => ({
  clientes, tecnicos, tarefas, configuracoes, ...
}), [clientes, tecnicos, tarefas, configuracoes, tecnicoAtualId, loading]);
```

---

**4. FinanceiroContext e PropostasContext — Silent refresh**

Remover `setLoading(true)` do `fetchAll` quando já existe data carregada (não é o load inicial). Adicionar `useMemo` no value.

```typescript
const fetchAll = useCallback(async () => {
  if (!orgId) return;
  if (titulos.length === 0) setLoading(true); // only on first load
  // ... fetch
  setLoading(false);
}, [orgId]);
```

---

**5. ReceitaContext — Eliminar fetch duplicado de `clients`**

`ReceitaContext` faz `supabase.from("clients").select("*")` independentemente — a mesma query que `AppContext` já faz. Refatorar para que `ReceitaContext` derive seus dados dos clientes já carregados pelo `AppContext`, ou usar um padrão `initialLoaded` para evitar o loading skeleton duplicado.

---

**6. QueryClient — Configurar staleTime global**

No `App.tsx`, o `QueryClient` é criado sem configuração. Adicionar defaults para evitar re-fetches excessivos:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 min
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

### Arquivos Afetados

| Arquivo | Alteração |
|---|---|
| `src/App.tsx` | Lazy imports, QueryClient config, Suspense |
| `src/contexts/AppContext.tsx` | Optimistic updates, useMemo no value, remover fetchAll de mutations |
| `src/contexts/FinanceiroContext.tsx` | Silent refresh, useMemo no value |
| `src/contexts/PropostasContext.tsx` | Silent refresh, useMemo no value |
| `src/contexts/ReceitaContext.tsx` | Silent refresh, useMemo no value |
| `src/contexts/UsersContext.tsx` | useMemo no value |
| `src/contexts/ParametrosContext.tsx` | useMemo no value |

### Impacto Esperado

- **Carregamento inicial**: ~60% mais rápido (lazy loading reduz bundle)
- **Navegação entre páginas**: sem skeletons desnecessários (silent refresh)
- **Mutations (criar/editar/excluir)**: resposta instantânea (optimistic updates)
- **Re-renders**: redução massiva via useMemo nos providers

