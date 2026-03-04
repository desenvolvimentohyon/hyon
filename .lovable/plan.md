

## Plan: Create `updated_at` triggers for all tables

A single migration adding `BEFORE UPDATE` triggers using the existing `handle_updated_at()` function to every table that has an `updated_at` column.

### Tables to cover (21 total):
`clients`, `profiles`, `organizations`, `company_profile`, `company_bank_accounts`, `proposals`, `proposal_items`, `proposal_settings`, `financial_titles`, `partners`, `payment_methods`, `bank_accounts`, `plan_accounts`, `plans`, `system_modules`, `custom_roles`, `crm_statuses`, `billing_rules`, `asaas_settings`, `client_contacts`, `monthly_adjustments`

### Migration SQL:
One `CREATE TRIGGER IF NOT EXISTS` per table, all in a single migration file. Each trigger fires `BEFORE UPDATE FOR EACH ROW EXECUTE FUNCTION handle_updated_at()`.

### Files:
| Action | File |
|--------|------|
| Migration | New trigger creation for 21 tables |

No code changes needed — this is purely a database schema change.

