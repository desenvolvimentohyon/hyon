

## Plan: "Minha Empresa" — Cadastro Institucional em Configurações

### Overview
Create a new "Minha Empresa" section inside the Configurações page with 6 internal tabs for the organization's institutional data. This requires a new database table, a storage bucket for logos, and a new UI component.

### 1. Database Migration

**Create `company_profile` table:**
- Single record per org (unique constraint on `org_id`)
- All fields from the prompt: legal_name, trade_name, cnpj, state/municipal registration, phone, whatsapp, email, website, address fields, tax_regime, cnae, csc_code, certificate_expiration, certificate_number, fiscal_notes, logo_path, logo_dark_path, primary_color, secondary_color, footer_text, institutional_text, default_due_day, proposal_validity_days, default_late_fee_percent, default_interest_percent, partner_commission_days, default_billing_message, default_proposal_message, created_at, updated_at
- RLS: SELECT for all authenticated org members, INSERT/UPDATE/DELETE restricted to admin role
- Updated_at trigger using existing `handle_updated_at` function

**Create `company_bank_accounts` table:**
- id, org_id, bank_name, bank_code, agency, account, type (corrente/poupança), pix_key, holder_name, holder_document, is_default (bool), created_at, updated_at
- RLS: SELECT for org, INSERT/UPDATE/DELETE for admin + financeiro

**Create storage bucket `company-logos`** (public: true for rendering in PDFs/proposals)

### 2. New Component: `src/components/configuracoes/MinhaEmpresa.tsx`

A single component with 6 internal tabs (Dados Gerais, Endereço, Fiscal, Bancário, Identidade Visual, Parâmetros Operacionais). Uses `useQuery`/`useMutation` from TanStack Query to fetch/save the `company_profile` record.

Key features:
- **Dados Gerais**: CNPJ mask + auto-lookup via existing `cnpj-lookup` edge function, all identification fields
- **Endereço**: CEP lookup via ViaCEP (same pattern as client detail), all address fields
- **Fiscal**: Tax regime select, CSC with copy button, certificate expiration with date picker, alert logic
- **Bancário**: CRUD list for `company_bank_accounts`, mark one as default
- **Identidade Visual**: Logo upload to `company-logos` bucket, color pickers, footer/institutional text
- **Parâmetros Operacionais**: Default due day, late fee %, interest %, proposal validity, commission days, message templates

Footer with "Cancelar" and "Salvar Alterações" buttons (same pattern as client detail).

### 3. Integrate into Configurações Page

Modify `src/pages/Configuracoes.tsx` to add top-level Tabs splitting "Configurações Gerais" (existing content) and "Minha Empresa" (new component). Only show "Minha Empresa" tab for admin users (check via `useAuth().profile.role`).

### 4. Files to Create/Edit

| Action | File |
|--------|------|
| Create | `src/components/configuracoes/MinhaEmpresa.tsx` |
| Edit | `src/pages/Configuracoes.tsx` (wrap in Tabs) |
| Migration | New table `company_profile`, `company_bank_accounts`, bucket `company-logos` |

### 5. Security
- RLS enforced by `org_id = current_org_id()` on both tables
- Admin-only edit enforced via `current_role() = 'admin'` in RLS policies
- UI hides the tab for non-admin users as an additional guard

