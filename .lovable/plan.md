

## Plano: Atualizar ícones do PWA com o logo Hyon

### Problema
Os arquivos `pwa-192x192.png` e `pwa-512x512.png` na pasta `public/` são imagens genéricas (placeholder), não o logo real do Hyon. Isso faz o ícone do PWA aparecer diferente do esperado.

### Solução
Gerar novos ícones PWA (192x192 e 512x512) a partir do `src/assets/logo-hyon.png` (o logo quadrado usado na sidebar) e substituir os arquivos existentes em `public/`.

### Passos
1. Copiar `src/assets/logo-hyon.png` para gerar versões redimensionadas em 192x192 e 512x512 pixels
2. Substituir `public/pwa-192x192.png` e `public/pwa-512x512.png` com as novas imagens
3. Também atualizar o `favicon.ico` para usar o mesmo logo, garantindo consistência visual

Nenhuma alteração de código é necessária — o `vite.config.ts` e `index.html` já referenciam esses arquivos corretamente.

