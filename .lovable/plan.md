

## Plano: Corrigir icones PWA e build error

### Problema identificado
Os arquivos `public/pwa-192x192.png` e `public/pwa-512x512.png` (e possivelmente `favicon.ico`) não correspondem ao logo real da Hyon (`src/assets/logo-hyon.png`). Além disso, há um erro de build em `breadcrumb.tsx`.

### Mudanças

1. **Copiar `logo-hyon.png` para os icones PWA** -- Substituir `public/pwa-192x192.png` e `public/pwa-512x512.png` com versões redimensionadas do `src/assets/logo-hyon.png`, e gerar um novo `favicon.ico` a partir dele.

2. **Corrigir build error em `breadcrumb.tsx`** -- Linha 44 tem `return;` (void) em vez de retornar o JSX do componente. Corrigir para retornar o elemento `<Comp>`.

### Arquivos editados
| Arquivo | Mudança |
|---------|---------|
| `public/pwa-192x192.png` | Substituir com logo-hyon.png redimensionado |
| `public/pwa-512x512.png` | Substituir com logo-hyon.png redimensionado |
| `public/favicon.ico` | Gerar a partir de logo-hyon.png |
| `src/components/ui/breadcrumb.tsx` | Corrigir return void → retornar JSX |

