

## Plano: Corrigir Sistema de Notificações Push e Cron Jobs

### Problemas Encontrados

#### 1. billing-cron NUNCA executa (403 Forbidden)
O cron job envia a requisição com `Authorization: Bearer <anon_key>`, mas a função verifica `req.headers.get("x-cron-secret")` contra `CRON_SECRET`. Como o cron job não envia o header `x-cron-secret`, a função sempre retorna 403. **Nenhuma notificação de cobrança está sendo gerada.**

#### 2. billing-cron NÃO envia push notifications
Mesmo se funcionasse, o billing-cron apenas insere registros na tabela `billing_notifications` (canal "interno"). Ele **nunca chama** a edge function `push-notifications` para enviar push real ao dispositivo do usuário.

#### 3. send-plan-renewal-alerts FALHA na autenticação
O cron job envia o anon key como Bearer token. A função tenta `authClient.auth.getUser()` com esse token, que falha porque o anon key não é um token de usuário válido. **Alertas de renovação nunca são enviados.**

#### 4. send-plan-renewal-alerts NÃO envia push
Mesmo se autenticasse, essa função apenas grava em `notification_logs` — não dispara push notifications.

---

### Correções Propostas

#### Arquivo 1: `supabase/functions/billing-cron/index.ts`
- **Corrigir autenticação**: Aceitar tanto `x-cron-secret` quanto `Authorization` com anon/service key (para compatibilidade com pg_cron)
- **Adicionar envio de push**: Após criar `billing_notification`, chamar a função de push para enviar notificação real ao(s) admin(s) da organização

```typescript
// Após criar billing_notification, disparar push:
const payload = JSON.stringify({
  title: diffDays >= 0 ? "📋 Mensalidade vencendo" : "🚨 Mensalidade em atraso",
  body: `${clientName} - R$ ${title.value_final} - ${notificationType}`,
  url: "/financeiro/contas-a-receber"
});
// Buscar subscriptions ativas da org e enviar push
```

#### Arquivo 2: `supabase/functions/send-plan-renewal-alerts/index.ts`
- **Corrigir autenticação**: Remover verificação de usuário autenticado, usar `x-cron-secret` ou simplesmente aceitar chamadas do pg_cron com anon key (já que `verify_jwt = false`)
- **Adicionar envio de push**: Após gravar em `notification_logs`, disparar push para admins da org

#### Arquivo 3: Atualizar cron jobs (SQL via insert)
- Adicionar header `x-cron-secret` nas chamadas do pg_cron **OU** ajustar as funções para aceitar o anon key

---

### Abordagem Técnica

A solução mais limpa:

1. **Padronizar auth dos crons**: As funções cron já têm `verify_jwt = false` no config.toml. Vamos usar o padrão `x-cron-secret` em todas, e atualizar os cron jobs no pg_cron para enviar esse header.

2. **Extrair lógica de push para função reutilizável**: O `billing-cron` e `send-plan-renewal-alerts` vão importar e usar `sendWebPush` inline (copiando a lógica) para enviar push diretamente, sem chamar outra edge function.

3. **Atualizar os 2 cron jobs** (billing-cron e send-plan-renewal-alerts) no pg_cron para incluir o header `x-cron-secret`.

### Impacto
- 2 edge functions editadas
- 2 cron jobs atualizados (SQL)
- Push notifications passarão a ser entregues quando mensalidades vencerem ou estiverem em atraso, e quando planos estiverem próximos do vencimento

