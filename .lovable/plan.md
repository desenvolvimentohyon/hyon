

## Diagnóstico: iPhone mostrando versão antiga

O problema é clássico de **cache do Service Worker no Safari/iOS**. O Safari no iPhone tem comportamento mais agressivo de cache para PWAs e o ciclo de atualização do SW nem sempre dispara o `onNeedRefresh` corretamente no iOS.

### Causas identificadas

1. **`globPatterns` cacheia todos os assets agressivamente** — `**/*.{js,css,html,ico,png,svg,woff2}` pre-cacheia tudo na instalação, e o Safari pode servir do cache mesmo com `NetworkFirst`
2. **`skipWaiting: true` sem forçar reload** — o novo SW ativa mas o Safari não recarrega as páginas já abertas automaticamente
3. **Sem versionamento de cache** — quando o SW antigo está ativo, não há mecanismo para forçar invalidação no iOS
4. **`onNeedRefresh` pode não disparar no Safari** — o Safari tem bugs conhecidos onde o evento de atualização do SW não chega ao cliente

### Solução

#### 1. `vite.config.ts` — Reduzir pre-cache e adicionar cache-busting
- Remover `globPatterns` agressivo — manter apenas `index.html` no pre-cache
- Adicionar `maximumFileSizeToCacheInBytes` para evitar cache de bundles grandes
- Reduzir `maxAgeSeconds` dos runtime caches para 5 minutos (em vez de 1 hora)
- Adicionar header `Cache-Control: no-cache` nos requests de navegação

#### 2. `src/main.tsx` — Forçar verificação periódica de atualização
- Adicionar `onRegisteredSW` callback que faz `registration.update()` a cada 60 segundos
- No `onNeedRefresh`, reduzir timeout de reload para 500ms (era 2000ms)
- Adicionar fallback: se o SW não disparar atualização, verificar via `fetch('/version.json')` com timestamp

#### 3. `index.html` — Meta tags anti-cache para Safari
- Adicionar `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">`
- Adicionar `<meta http-equiv="Pragma" content="no-cache">`
- Adicionar `<meta http-equiv="Expires" content="0">`

#### 4. Criar mecanismo de versão forçada
- O `registerSW` passará a fazer polling com `intervalMS: 60000` para verificar atualizações automaticamente no iOS

### Arquivos afetados

| Arquivo | Alteração |
|---|---|
| `vite.config.ts` | Reduzir pre-cache, diminuir TTL dos caches |
| `src/main.tsx` | Polling de atualização a cada 60s, reload mais rápido |
| `index.html` | Meta tags anti-cache para Safari |

