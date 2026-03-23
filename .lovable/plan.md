

## Plano: Simplificar Sidebar — Apenas Nomes de Módulos

### Resumo
Remover os submódulos expandíveis da sidebar lateral, mantendo apenas os nomes dos módulos-pai (Dashboard, Clientes, Comercial, etc.). Ao clicar em um módulo, navegar diretamente para sua página principal, onde o `ModuleNavGrid` (grid de cards do screenshot) já mostra os submódulos com indicadores.

### O que muda

A sidebar passa de:
```text
▼ Dashboard          →    Dashboard
    Visão Geral           Clientes
    Modo Cockpit          Comercial
    Painel Executivo      Financeiro
    Radar Crescimento     Suporte e Operacional
▼ Clientes                Cartões
    Cadastro              Configurações
    Receita / MRR
    Checkout
```
Sidebar limpa, sem chevrons, sem expansão. Clique navega direto.

### 1. Editar: `src/components/layout/AppSidebar.tsx`

- Remover lógica de `openModules`, `toggleModule`, `ChevronDown`
- Remover renderização dos `children` expandíveis
- Cada módulo-pai vira um `NavLink` direto para `mod.directUrl || mod.children[0].url`
- Manter: busca (filtra módulos-pai pelo nome), favoritos, cores semânticas, footer do usuário, modo collapsed (ícones)
- Manter seção de favoritos (permite acesso rápido a submódulos específicos)

### 2. Editar: `src/lib/sidebarModules.ts`

- Garantir que todos os módulos tenham `directUrl` definido:
  - `dashboard` → `/`
  - `clientes` → `/clientes`
  - `comercial` → `/propostas`
  - `financeiro` → `/financeiro`
  - `operacional` → `/suporte`
  - `cartoes` → `/cartoes`
  - `configuracoes` → `/configuracoes`

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/layout/AppSidebar.tsx` | Remover expansão de children, navegar direto |
| `src/lib/sidebarModules.ts` | Adicionar `directUrl` aos módulos que faltam |

### Notas
- `ModuleNavGrid` já está presente em todas as páginas principais — é ele que exibe os cards do screenshot
- Favoritos continuam funcionando como atalhos diretos
- Nenhuma rota ou página alterada
- Sidebar fica mais limpa e profissional

