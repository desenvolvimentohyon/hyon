

## Plano: Melhoria Agressiva de Fluidez e Performance

### Diagnóstico

Após análise completa do código, identifiquei os seguintes gargalos:

1. **8 Google Fonts carregadas no CSS** — bloqueia renderização inicial (~800ms+)
2. **Dados duplicados entre contextos** — `clients` é carregado em AppContext E ReceitaContext (2x a mesma query)
3. **fetchAll() cascata desnecessária** — após cada mutação, todos os contextos refazem TODAS as queries (ex: atualizar 1 tarefa recarrega clientes, profiles, tarefas, comments, history)
4. **AppContext.fetchAll recria `initialLoaded` instável** — `initialLoaded` no array de deps do `useCallback` causa refetch infinito potencial
5. **Topbar reconstrói notificações a cada render** — `useMemo` depende de arrays completos (titulos, propostas, tarefas) que mudam após qualquer mutação
6. **AuthContext sem memoização do value** — causa re-render em toda a árvore a cada mudança de estado
7. **Sem `will-change` e `contain` CSS** — browser não otimiza composição das áreas de scroll

### Alterações

#### 1. Fontes — `src/index.css`
- Remover 7 das 8 importações de Google Fonts (manter apenas Inter que é a fonte principal)
- Adicionar `font-display: swap` via query parameter na URL restante
- Adicionar `contain: content` no main de scroll e `will-change: transform` na sidebar

#### 2. AuthContext — `src/contexts/AuthContext.tsx`
- Memoizar o `value` do Provider com `useMemo` para evitar re-renders desnecessários em toda a árvore

#### 3. AppContext — `src/contexts/AppContext.tsx`
- Remover `initialLoaded` do array de deps do `fetchAll` (bug de estabilidade)
- Usar `useRef` para `initialLoaded` (igual aos outros contextos já fazem)
- Adicionar debounce/dedupe no `fetchAll` para evitar múltiplas chamadas simultâneas

#### 4. ReceitaContext — `src/contexts/ReceitaContext.tsx`
- Remover query duplicada de `clients` — reutilizar dados do AppContext via prop ou manter independente mas com staleTime (já que ambos fazem `select("*")` em clients)
- Adicionar dedupe ref para evitar fetches simultâneos

#### 5. FinanceiroContext — `src/contexts/FinanceiroContext.tsx`
- Adicionar dedupe ref para `fetchAll`
- Optimistic updates nas operações mais comuns (addTitulo, updateTitulo)

#### 6. PropostasContext — `src/contexts/PropostasContext.tsx`
- Adicionar dedupe ref para `fetchAll`

#### 7. Topbar — `src/components/layout/Topbar.tsx`
- Estabilizar deps do `useMemo` de notificações usando `.length` checks antes de recalcular

#### 8. CSS Performance — `src/index.css`
- Adicionar `contain: layout style` em `.gradient-bg` (main content)
- Adicionar GPU compositing hints nas áreas de scroll
- `content-visibility: auto` para listas longas

#### 9. Layout — `src/components/layout/AppLayout.tsx`
- Adicionar `will-change: transform` no wrapper de scroll do main para composição GPU

### Arquivos Afetados

| Arquivo | Alteração |
|---|---|
| `src/index.css` | Remover 7 fontes, adicionar CSS de performance |
| `src/contexts/AuthContext.tsx` | Memoizar value |
| `src/contexts/AppContext.tsx` | Fix initialLoaded ref + dedupe fetchAll |
| `src/contexts/ReceitaContext.tsx` | Dedupe fetchAll |
| `src/contexts/FinanceiroContext.tsx` | Dedupe fetchAll + optimistic updates |
| `src/contexts/PropostasContext.tsx` | Dedupe fetchAll |
| `src/components/layout/AppLayout.tsx` | CSS hints de composição |

### Impacto Esperado
- **First paint**: ~500-800ms mais rápido (fontes removidas)
- **Navegação entre módulos**: eliminação de re-renders cascata
- **Mutações**: resposta visual instantânea com optimistic updates expandidos
- **Scroll**: composição GPU para 60fps constante

