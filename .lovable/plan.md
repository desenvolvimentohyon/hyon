

## Plano: Corrigir Cache PWA que Serve Versão Antiga ao Atualizar

### Causa Raiz

O problema está na estratégia de cache do Service Worker. A configuração atual usa **`StaleWhileRevalidate`** para assets JS/CSS (linha 51-57 do `vite.config.ts`), o que significa:

1. Ao atualizar a página, o SW serve os arquivos JS/CSS **do cache antigo** imediatamente
2. Só depois busca a versão nova no servidor e atualiza o cache
3. Resultado: o usuário vê a versão antiga até fazer F5 duas vezes

Isso é inaceitável para um SaaS comercial.

### Correções

**1. `vite.config.ts` — Mudar estratégia de cache de assets**

Trocar `StaleWhileRevalidate` por `NetworkFirst` para assets JS/CSS. Como o Vite gera nomes de arquivo com hash (ex: `index-a1b2c3.js`), arquivos novos nunca colidem com antigos. A estratégia `NetworkFirst` garante que o browser sempre tente buscar do servidor primeiro.

Além disso, reduzir o `maxAgeSeconds` do cache de assets para 1 hora (em vez de 24h).

**2. `src/main.tsx` — Auto-reload ao detectar nova versão**

Atualmente o `onNeedRefresh` apenas mostra um banner pedindo ao usuário para clicar "Atualizar". Para um SaaS, a atualização deve ser automática:

- Manter o banner como feedback visual (2 segundos)
- Disparar `updateSW()` automaticamente após breve delay
- Forçar `window.location.reload()` após o SW ser atualizado

**3. `vite.config.ts` — Adicionar `navigateFallback` com exclusões corretas**

Garantir que rotas públicas (proposta, portal, aceite) não sejam interceptadas pelo SW, mantendo o `navigateFallbackDenylist` atual.

### Arquivos Afetados

| Arquivo | Alteração |
|---|---|
| `vite.config.ts` | `StaleWhileRevalidate` → `NetworkFirst` para assets, reduzir TTL do cache |
| `src/main.tsx` | Auto-reload ao detectar nova versão (sem depender de clique do usuário) |

### Impacto

- Ao atualizar a página, o usuário **sempre** verá a versão mais recente
- Novas versões publicadas serão aplicadas automaticamente sem intervenção
- Comportamento adequado para um produto SaaS comercial

