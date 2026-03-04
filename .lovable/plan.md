

## Plan: Portal do Cliente Completo — Phase 1

This is a large initiative. I'll scope it into a **Phase 1** that delivers the core portal experience (tickets, suggestions, referrals, modules, profile, onboarding) and a **Phase 2** (training center, notifications, rewards) for a follow-up.

---

### Phase 1 Scope

1. **Database: 4 new tables** + portal-data edge function expansion
2. **Portal UI**: Expand from 3 tabs to 7 tabs (Dashboard, Contrato, Financeiro, Módulos, Suporte, Indicações, Perfil) + onboarding flow
3. **Admin side**: Surface tickets + referrals in existing pages

---

### 1. Database Migration

```sql
-- Support tickets from portal clients
CREATE TABLE public.portal_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_tickets ENABLE ROW LEVEL SECURITY;

-- Ticket messages (conversation thread)
CREATE TABLE public.portal_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.portal_tickets(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  sender_type text NOT NULL DEFAULT 'client', -- 'client' or 'staff'
  sender_name text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Client suggestions
CREATE TABLE public.portal_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'nova',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_suggestions ENABLE ROW LEVEL SECURITY;

-- Client referrals
CREATE TABLE public.portal_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_referrals ENABLE ROW LEVEL SECURITY;

-- Onboarding progress tracking column
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS onboarding_completed_steps text[] NOT NULL DEFAULT '{}';

-- RLS: internal staff can manage via org_id
-- (policies for select/insert/update on all 4 tables using current_org_id())
-- Portal access handled via edge function with service_role
```

RLS policies for admin access using `current_org_id()` for SELECT/INSERT/UPDATE on all tables. Portal client access will go through the edge function (service_role key), so no public RLS needed.

---

### 2. Edge Function: `portal-data` — Expand Response

Add to the existing `portal-data/index.ts`:
- Fetch `system_modules` linked to the client's system
- Fetch `portal_tickets` for the client
- Fetch `portal_referrals` for the client
- Return `onboarding_completed_steps` from client record
- Include `contract_start_at` in client response

### 3. Edge Function: `portal-action` — New

Create `supabase/functions/portal-action/index.ts` to handle portal write operations (authenticated by token):
- `POST /portal-action?token=X` with JSON body:
  - `action: "create_ticket"` → insert into `portal_tickets`
  - `action: "add_ticket_message"` → insert into `portal_ticket_messages`
  - `action: "create_suggestion"` → insert into `portal_suggestions`
  - `action: "create_referral"` → insert into `portal_referrals`
  - `action: "update_profile"` → update client phone/email
  - `action: "complete_onboarding_step"` → append to `onboarding_completed_steps`

All actions validate token → get client_id/org_id → perform insert with service_role.

---

### 4. Portal UI Redesign — `src/pages/PortalCliente.tsx`

Expand from current 3-tab layout to a full portal with sidebar navigation on desktop / bottom tabs on mobile:

**Tabs/Sections:**
- **Dashboard**: KPI cards (Sistema, Plano, Mensalidade, Status, Próximo vencimento, Tempo como cliente)
- **Contrato**: Existing contract tab (keep as-is)
- **Financeiro**: Existing financial tab (keep as-is)
- **Módulos**: List active modules for the client's system from `system_modules`
- **Suporte**: List tickets + create new ticket form + conversation thread
- **Sugestões**: Submit suggestions form + list of past suggestions
- **Indicações**: Referral form (empresa, responsável, telefone, cidade, observação) + list
- **Perfil**: Show/edit phone + email

**Onboarding overlay** (first access):
- Show if `onboarding_completed_steps` is empty
- Steps: "Conheça o sistema", "Acesse seus dados", "Abra um chamado"
- Progress bar, dismissable, saves steps via `portal-action`

---

### 5. Admin Integration

- **Suporte page** (`src/pages/Suporte.tsx`): Add a sub-tab "Tickets Portal" showing `portal_tickets` with status management and reply capability
- **Dashboard** (`src/pages/Dashboard.tsx`): Add a small "Indicações recebidas" card showing recent `portal_referrals`

---

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/portal-action/index.ts` | Write operations for portal |

### Files to Edit
| File | Change |
|------|--------|
| `supabase/functions/portal-data/index.ts` | Add modules, tickets, referrals, onboarding to response |
| `src/pages/PortalCliente.tsx` | Full redesign with 7+ tabs, onboarding, tickets, referrals, suggestions |
| `src/pages/Suporte.tsx` | Add "Tickets Portal" sub-tab |
| `src/pages/Dashboard.tsx` | Add referrals indicator card |

### Migration
One SQL migration creating 4 tables + RLS policies + client column.

### Phase 2 (Future)
- Training center (tutorials table, video embedding)
- Notification system for clients
- Rewards/credits for referrals
- Portal email notifications

