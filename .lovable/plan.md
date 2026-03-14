

## Plano: Corrigir modal "Novo Módulo" que não abre

### Causa raiz

O componente `SelectItem` do Radix UI **não aceita `value=""`** (string vazia). Quando o Dialog tenta renderizar o Select de "Sistema vinculado" com `<SelectItem value="">Nenhum</SelectItem>`, o componente quebra silenciosamente e o modal não aparece.

O bug existe em dois arquivos:
- `src/pages/Configuracoes.tsx` (linha 521)
- `src/pages/Parametros.tsx` (linha 221)

### Correção

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Configuracoes.tsx` | Trocar `value=""` por `value="none"` no SelectItem + ajustar lógica de `sistemaId` |
| `src/pages/Parametros.tsx` | Mesma correção |

Em ambos os arquivos:
1. `<SelectItem value="">` → `<SelectItem value="none">`
2. No `openNewModulo`, inicializar `sistemaId: "none"` em vez de `""`
3. No `saveModulo`, converter `sistemaId === "none"` para `""` antes de salvar

