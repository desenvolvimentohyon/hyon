

## Plano: Notificações Push no PWA

### Resumo
Implementar sistema completo de notificações push para o PWA, incluindo: registro de dispositivos, service worker com suporte a push, edge function para envio, painel de configuração, e integração com eventos do sistema.

---

### Etapa 1 — Gerar chaves VAPID e armazenar como secrets

As chaves VAPID (pública e privada) são necessárias para Web Push. A chave pública vai no frontend; a privada fica apenas no backend.

- Criar edge function `generate-vapid-keys` (uso único) ou gerar externamente
- Armazenar `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` como secrets via `add_secret`
- A chave pública será exposta no frontend via uma edge function ou hardcoded após geração

---

### Etapa 2 — Migration: tabela `push_subscriptions`

```sql
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  device_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: usuário só vê/gerencia suas próprias subscriptions dentro da org
CREATE POLICY "ps_select" ON public.push_subscriptions FOR SELECT TO authenticated
  USING (org_id = current_org_id() AND user_id = auth.uid());
CREATE POLICY "ps_insert" ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (org_id = current_org_id() AND user_id = auth.uid());
CREATE POLICY "ps_update" ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (org_id = current_org_id() AND user_id = auth.uid());
CREATE POLICY "ps_delete" ON public.push_subscriptions FOR DELETE TO authenticated
  USING (org_id = current_org_id() AND user_id = auth.uid());
```

---

### Etapa 3 — Edge Function: `push-notifications`

Ações via `action` param:

| Action | Descrição |
|--------|-----------|
| `get-vapid-key` | Retorna chave pública VAPID |
| `subscribe` | Salva/atualiza subscription no banco |
| `unsubscribe` | Remove subscription |
| `test` | Envia push de teste ao dispositivo atual |
| `send` | Envia push para um user/org (uso interno) |

Usa biblioteca `web-push` para Deno. Valida JWT em código. Isola por `org_id`.

---

### Etapa 4 — Service Worker com suporte a Push

Adicionar arquivo `public/sw-push.js` com handlers:

- `push` event → exibe notificação com título, corpo, ícone, URL de destino
- `notificationclick` event → abre o PWA na URL de destino

Configurar `vite-plugin-pwa` para injetar o sw-push.js como importScript no workbox, ou registrar como SW separado que coexiste com o workbox SW.

**Abordagem escolhida**: usar `injectManifest` com custom SW que importa o workbox e adiciona os handlers push, OU usar `importScripts` no SW gerado. A opção mais segura é adicionar `sw-push.js` em public/ e importá-lo via `workbox.importScripts` no config do VitePWA.

---

### Etapa 5 — Hook: `usePushNotifications`

Novo hook em `src/hooks/usePushNotifications.ts`:

- `permission` — estado da permissão (default/granted/denied)
- `isSubscribed` — se o dispositivo está registrado
- `subscribe()` — pede permissão + registra no backend
- `unsubscribe()` — remove do backend
- `sendTest()` — dispara push de teste
- `supported` — se o browser suporta Push API

---

### Etapa 6 — Componente: `PushNotificationBanner`

Card discreto que aparece quando o PWA está instalado e push não está ativado:

> "Ative as notificações para receber alertas importantes no seu celular."
> [Ativar notificações]

Aparece no layout principal. Dismissível com localStorage.

---

### Etapa 7 — Painel: Configurações > Notificações Push

Adicionar nova subtab em Configurações Gerais:

- **Status**: Ativado/Desativado + info do dispositivo
- **Testar**: Botão "Enviar notificação de teste"
- **Reinscrever**: Atualiza subscription
- **Remover dispositivo**: Remove subscription atual
- **Lista de dispositivos**: Mostra dispositivos inscritos do usuário

---

### Etapa 8 — Edge Function: `send-push-event`

Function dedicada para envio de push por eventos do sistema. Recebe:
```json
{ "event_type": "proposta_aceita", "user_ids": [...], "org_id": "...", "title": "...", "body": "...", "url": "/propostas/123" }
```

Busca subscriptions ativas dos users e envia via web-push.

---

### Etapa 9 — Integração com eventos existentes

Adicionar chamadas de push nos pontos do sistema onde eventos importantes ocorrem:

| Evento | Onde disparar | URL destino |
|--------|--------------|-------------|
| Proposta aceita | PropostaDetalhe / edge function | `/propostas/:id` |
| Tarefa urgente | Tarefas (criação) | `/tarefas/:id` |
| Cliente inadimplente | billing-cron | `/financeiro/contas-a-receber` |
| Certificado vencendo | health-score-cron | `/clientes/:id` |
| Renovação próxima | send-plan-renewal-alerts | `/clientes/:id` |

Implementação inicial simples: chamar a edge function `send-push-event` via `supabase.functions.invoke()` quando o evento ocorre no frontend, ou via fetch interno nas edge functions cron existentes.

---

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Tabela `push_subscriptions` com RLS |
| `supabase/functions/push-notifications/index.ts` | Edge function principal (subscribe, test, send) |
| `public/sw-push.js` | Service worker push handlers |
| `vite.config.ts` | Adicionar `importScripts` no workbox config |
| `src/hooks/usePushNotifications.ts` | Hook para gerenciar push |
| `src/components/PushNotificationBanner.tsx` | Banner de ativação |
| `src/components/configuracoes/PushNotificationsSettings.tsx` | Painel de configuração |
| `src/pages/Configuracoes.tsx` | Adicionar subtab "Notificações Push" |
| `src/components/layout/AppLayout.tsx` | Incluir PushNotificationBanner |
| Secrets | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` |

### Detalhes técnicos

- **Web Push**: usa protocolo padrão RFC 8030 com VAPID (RFC 8292)
- **Biblioteca**: `web-push` via npm no Deno edge function
- **Segurança**: chave privada VAPID só no backend; subscriptions isoladas por org_id + user_id via RLS
- **PWA**: não altera o manifest nem o registerType existente; apenas injeta script adicional no SW

