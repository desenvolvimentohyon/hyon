

## Plano: Link de acompanhamento com protocolo para chamados de suporte

### Resumo
Ao criar um chamado de suporte (tarefa tipo "suporte"), o sistema gera automaticamente um número de protocolo e um token público. Um link de acompanhamento é gerado para enviar ao cliente, onde ele pode ver o status, checklist (o que foi feito / o que falta) e mensagens.

### 1. Migration SQL — Adicionar campos na tabela `portal_tickets`

- `protocol_number` (text, unique) — Protocolo legível tipo `SUP-20260323-0001`
- `tracking_token` (text, unique, default random hex) — Token público para acesso sem autenticação

### 2. Edge Function: `supabase/functions/ticket-tracking/index.ts`

Endpoint público (sem JWT) que recebe `?token=xxx` e retorna:
- Dados do ticket: protocolo, título, status, data de criação
- Tarefa vinculada: checklist (itens concluídos/pendentes), status, tempo gasto
- Mensagens do ticket (apenas as públicas)
- Nome do cliente (sem dados sensíveis)

### 3. Nova página: `src/pages/TicketTracking.tsx`

Página pública (sem autenticação) acessível via `/acompanhamento?token=xxx`:
- Exibe o protocolo em destaque
- Barra de progresso baseada no checklist da tarefa vinculada
- Lista do checklist: ✅ concluído / ⬜ pendente
- Status atual com badge colorido
- Timeline de mensagens
- Design limpo e responsivo (mobile-first, pois o cliente provavelmente abre pelo WhatsApp)

### 4. Editar: `src/pages/Suporte.tsx` — Gerar protocolo ao criar tarefa de suporte

Na função `handleCreateTaskFromTicket`:
- Gerar protocolo sequencial (`SUP-YYYYMMDD-NNNN`)
- Gerar tracking_token (random hex)
- Salvar no `portal_tickets`
- Exibir o link de acompanhamento com botão "Copiar Link"

Na visualização do ticket (detalhe):
- Exibir protocolo e botão "Copiar Link de Acompanhamento"

### 5. Editar: `src/App.tsx` — Rota pública

Adicionar rota `/acompanhamento` apontando para `TicketTracking`.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Adicionar `protocol_number` e `tracking_token` em `portal_tickets` |
| `supabase/functions/ticket-tracking/index.ts` | Edge function pública para dados do acompanhamento |
| `src/pages/TicketTracking.tsx` | Página pública de acompanhamento |
| `src/pages/Suporte.tsx` | Gerar protocolo + exibir link copiável |
| `src/App.tsx` | Rota `/acompanhamento` |

