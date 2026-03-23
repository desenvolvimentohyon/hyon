

## Plano: Corrigir reset de tela ao atualizar dados

### Problema
Toda mutação (`addTarefa`, `updateTarefa`, `startTimer`, `stopTimer`) chama `fetchAll()`, que executa `setLoading(true)` — isso exibe o skeleton de carregamento completo, resetando a view atual (aba, filtros, scroll) e forçando o usuário de volta ao estado inicial.

### Solução
Separar o carregamento inicial (loading) do recarregamento em background (refresh silencioso).

### Editar: `src/contexts/AppContext.tsx`

1. **Criar flag `initialLoaded`** — controla se é o primeiro carregamento ou um refresh subsequente
2. **Alterar `fetchAll`** — só seta `setLoading(true)` no primeiro carregamento. Em refreshes subsequentes, atualiza os dados silenciosamente sem mostrar skeleton
3. **Resultado**: ao criar/editar tarefa, os dados são recarregados em background sem perder a posição do usuário na tela

```text
Antes:  fetchAll → setLoading(true) → skeleton → reset UI
Depois: fetchAll → (se já carregou) → atualiza dados silenciosamente → UI preservada
```

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AppContext.tsx` | Loading apenas no primeiro fetch, refreshes silenciosos |

