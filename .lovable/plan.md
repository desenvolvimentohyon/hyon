

## Plano: Forçar atualização imediata do Service Worker (PWA)

### Problema
O sistema usa PWA com Workbox que cacheia todos os assets (JS, CSS, HTML). Quando há uma atualização, o Service Worker antigo continua servindo os arquivos cacheados até que o novo SW seja ativado — o que pode demorar ou exigir fechar todas as abas. Isso faz o usuário ver a versão antiga ao entrar.

### Solução

**1. `vite.config.ts`** — Configurar Workbox para ativação imediata:
- Adicionar `skipWaiting: true` e `clientsClaim: true` na config do workbox, forçando o novo SW a tomar controle imediatamente
- Alterar a estratégia de navegação para `NetworkFirst` (busca sempre do servidor primeiro, usa cache só como fallback offline)
- Definir `runtimeCaching` com estratégia `NetworkFirst` para requests de navegação e `StaleWhileRevalidate` para assets estáticos com expiração curta

**2. `src/main.tsx`** — Detectar atualização e recarregar:
- Registrar callback `onNeedRefresh` que automaticamente recarrega a página quando um novo SW está pronto
- Usar `registerSW` do `virtual:pwa-register` para controlar o ciclo de vida

### Detalhes técnicos

```text
vite.config.ts (workbox section):
  + skipWaiting: true
  + clientsClaim: true  
  + runtimeCaching: NetworkFirst para navegação
  + cleanupOutdatedCaches: true

src/main.tsx:
  + import { registerSW } from 'virtual:pwa-register'
  + registerSW({ onNeedRefresh() { window.location.reload() } })
```

Isso garante que ao abrir o sistema, o browser busque a versão mais recente do servidor e ative o novo SW sem esperar o usuário fechar abas.

