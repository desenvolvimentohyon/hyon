

## Plano: Indicador dinâmico de versão do sistema

### Contexto
O sidebar já exibe `v1.0` estático no rodapé. O objetivo é torná-lo dinâmico com data/hora do build, facilitando a verificação de atualização no iPhone.

### Alterações

#### 1. `vite.config.ts`
- Adicionar `define` com `__BUILD_TIMESTAMP__` (data/hora ISO do build) para injetar automaticamente a versão em cada deploy

#### 2. `src/vite-env.d.ts`
- Declarar a variável global `__BUILD_TIMESTAMP__`

#### 3. `src/components/layout/AppSidebar.tsx`
- Substituir o texto estático `v1.0` por uma versão formatada usando o timestamp do build (ex: `v02abr 14:30`)
- No modo collapsed, mostrar versão abreviada

### Resultado
Cada deploy gera automaticamente um identificador único de versão visível no rodapé do sidebar, permitindo confirmar rapidamente se o iPhone está rodando a versão mais recente.

