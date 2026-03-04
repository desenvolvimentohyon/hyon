

## Plan: WhatsApp Sending for Proposals

### Summary
Add a "Send via WhatsApp" flow that generates a formatted message with the proposal link, opens `wa.me` with the client's phone, updates proposal status to "Enviada", and records `whatsapp_sent_at` in the database.

### 1. Database Migration
Add columns to `proposals` table:
- `whatsapp_sent_at` (timestamptz, nullable)
- `whatsapp_send_count` (integer, default 0)

### 2. Update `PropostaDetalhe.tsx` — WhatsApp Send Dialog
Replace the current generic "Enviar" dialog with a WhatsApp-focused send flow:
- When clicking "Enviar" button, build the formatted message using proposal data + company name from `crmConfig`
- Show a modal with:
  - Pre-filled message (editable textarea)
  - "Copiar Mensagem" button
  - "Copiar Link" button  
  - "Abrir WhatsApp" primary button
- On "Abrir WhatsApp":
  - Look up client phone from `clientes` array using `form.clienteId`
  - If no phone: show toast error "Telefone do cliente não cadastrado"
  - If phone exists: clean number (remove non-digits, add 55 if needed), open `https://wa.me/{phone}?text={encoded_message}`
  - Update proposal: `statusVisualizacao = "enviado"`, `statusCRM = "Enviada"`, set `dataEnvio`, `dataValidade`
  - Record `whatsapp_sent_at` and increment `whatsapp_send_count` via Supabase update
  - Show toast "Proposta aberta no WhatsApp"

### 3. Update `Propostas.tsx` — Row Action Menu
Add "Enviar via WhatsApp" option to the "..." dropdown menu on each proposal row. This will:
- Build the message
- Look up client phone
- Open `wa.me` directly (quick action, no modal)
- Update status and record tracking

### 4. Update `PropostasContext.tsx`
- Add `whatsappSentAt` and `whatsappSendCount` to the `dbToProposta` mapper
- Map them in `propostaToDb` for updates

### 5. Update `types/propostas.ts`
- Add `whatsappSentAt` and `whatsappSendCount` fields to the `Proposta` interface

### Files to Edit
| File | Change |
|------|--------|
| `src/types/propostas.ts` | Add whatsapp tracking fields to interface |
| `src/contexts/PropostasContext.tsx` | Map new fields in db↔proposta mappers |
| `src/pages/PropostaDetalhe.tsx` | Replace send dialog with WhatsApp flow (editable message, copy, open WhatsApp) |
| `src/pages/Propostas.tsx` | Add "Enviar via WhatsApp" to row dropdown menu |

### Migration SQL
```sql
ALTER TABLE public.proposals 
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_send_count integer NOT NULL DEFAULT 0;
```

No new routes, no new dependencies, no changes to public page.

