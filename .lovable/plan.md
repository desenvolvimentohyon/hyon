

## Plan: Professional PDF Generator for Proposals

### Approach
Replace the current `pdfGenerator.ts` (which downloads an HTML file) with a proper PDF generator that opens a styled print-ready HTML page and triggers `window.print()` — the most reliable client-side approach for professional PDFs without adding heavy dependencies.

### 1. Rewrite `src/lib/pdfGenerator.ts`

Create a new function `generateProposalPDF(data)` that:
- Accepts proposal data + company profile data (from Supabase, not the old local `CRMConfig`)
- Builds a multi-section HTML document styled for print (`@media print`, `@page` rules)
- Opens in a new window and triggers `window.print()` (user saves as PDF)
- File name hint via `<title>` tag: `proposta-{client}-{date}`

**Sections in the PDF:**
1. **Cover** — Logo (from `company-logos` bucket or fallback initial), company name/phone/email/website, "PROPOSTA COMERCIAL" title, system name, client name, date, validity
2. **Commercial Summary** — Styled cards for system, plan, monthly value, implementation value + payment flow
3. **What's Included** — 6-item checklist with markers (implantação, treinamento, suporte, config equipamentos, atualizações, acesso remoto)
4. **System Description** — `company_profile.institutional_text` or default paragraph
5. **Commercial Conditions** — Table (Implantação / Mensalidade values) + bullet observations
6. **Next Steps** — 4-step timeline (aceite → agendamento → treinamento → operação)
7. **Signature Block** — If accepted: "Aceita em {date} por {name}". If pending: blank signature lines
8. **Footer** — Company name, CNPJ, phone, email, address, footer text

**Styling:** Uses `primary_color` and `secondary_color` from company profile. Print-optimized (no shadows, clean borders, proper page breaks).

### 2. Update `src/pages/PropostaDetalhe.tsx`

- Change `handlePDF()` to call new generator with company profile data (fetch from Supabase if not cached)
- Keep existing save/tracking logic

### 3. Update `src/pages/PropostaPublica.tsx`

- Replace `handleDownloadPdf` placeholder (`alert(...)`) with actual PDF generation
- Fetch company profile data is already available in state (`company`)
- Track `pdf_downloaded_at` event (already wired)

### 4. Update edge function `public-proposal/index.ts`

- Add `cnpj`, `address_street`, `address_number`, `address_neighborhood`, `address_city`, `address_uf`, `address_cep`, `institutional_text` to the company profile SELECT so the public page has all data needed for PDF generation

### Files to edit
| File | Change |
|------|--------|
| `src/lib/pdfGenerator.ts` | Full rewrite — professional print-ready PDF generator |
| `src/pages/PropostaDetalhe.tsx` | Wire new PDF generator with company data |
| `src/pages/PropostaPublica.tsx` | Replace alert placeholder with real PDF generation |
| `supabase/functions/public-proposal/index.ts` | Expand company profile SELECT fields |

No new dependencies. No internal UI changes. No route changes.

