

## Plan: Fix Footer Overlap + Add Destructive Action Confirmations

### 1. Fix ClienteDetalhe footer overlapping sidebar

**File:** `src/components/clientes/ClienteDetalhe.tsx` (lines ~187-196)

Change the fixed footer from `left-0 right-0` to only span the content area. Since the component renders inside `AppLayout`'s `<main>` which is already to the right of the sidebar, the simplest fix is to make the footer sticky at the bottom of the scrollable content area instead of fixed to the viewport.

Replace:
```
fixed bottom-0 left-0 right-0
```
With:
```
sticky bottom-0
```

This keeps the footer pinned at the bottom of the scrollable `<main>` without overlapping the sidebar. Remove the `pb-20` spacer on the content since sticky handles it naturally, and remove the `max-w-5xl mx-auto` wrapper inside the footer (the parent already constrains width).

### 2. Add AlertDialog to bank account deletion in MinhaEmpresa

**File:** `src/components/configuracoes/MinhaEmpresa.tsx`

- Add state `deleteBankId` (similar pattern to `TabContatos.tsx`)
- Import `AlertDialog` components
- Replace direct `deleteBank(b.id)` call on line 544 with `setDeleteBankId(b.id)`
- Add AlertDialog at bottom of component

### 3. TabContatos already has AlertDialog

The `TabContatos.tsx` component already has a proper `AlertDialog` for contact deletion — no changes needed there.

### Files to edit:
| File | Change |
|------|--------|
| `src/components/clientes/ClienteDetalhe.tsx` | Fix footer positioning (sticky instead of fixed) |
| `src/components/configuracoes/MinhaEmpresa.tsx` | Add AlertDialog for bank account deletion |

