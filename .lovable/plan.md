

## Plano: Reduzir números do Dashboard + Nome do usuário no footer da sidebar

### Mudanças

**1. Dashboard — reduzir tamanho dos números KPI** (`src/pages/Dashboard.tsx`)
- Linha 635: KPI principal `text-2xl lg:text-3xl font-extrabold` → `text-lg lg:text-xl font-bold`
- Linhas 838, 843, 848: Operacionais `text-xl font-bold` → `text-base font-semibold`

**2. Sidebar — nome do usuário logado no footer** (`src/components/layout/AppSidebar.tsx`)
- No `SidebarFooter` (linhas 317-326), adicionar o nome do usuário logado (obtido via `useUsers().getCurrentUser()`) acima do copyright
- Quando colapsado, mostrar apenas as iniciais do usuário em um avatar circular
- Quando expandido, mostrar nome completo + cargo/role em texto pequeno

### Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Reduzir classes de tamanho de font nos KPIs |
| `src/components/layout/AppSidebar.tsx` | Adicionar info do usuário no SidebarFooter |

