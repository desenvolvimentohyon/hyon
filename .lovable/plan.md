

## Plano: Redesign Visual — Sidebar Expandida + Lista de Clientes em Cards

Este plano transforma o layout do sistema para ficar semelhante à imagem de referência (ITControl ONE), com sidebar expandida com texto, sub-navegação em abas horizontais, e lista de clientes em cards com borda lateral colorida.

---

### Fase 1 — Sidebar Expandida com Menu de Texto

**`src/components/layout/AppLayout.tsx`**
- Substituir `ModuleNavBar` por `AppSidebar` dentro de um `SidebarProvider`
- Adicionar `SidebarTrigger` no Topbar para controle de colapso
- Manter a estrutura `flex` existente

**`src/components/layout/AppSidebar.tsx`**
- Reformular a navegação do grid de cards (2 colunas) para uma lista vertical com grupos expansíveis (Collapsible)
- Cada módulo vira um grupo com chevron (>) que expande/colapsa mostrando sub-itens
- Manter o logo no topo, busca, favoritos e footer com dados do usuário
- Sub-itens ficam visíveis ao expandir o grupo (estilo menu tradicional)
- Grupo ativo abre automaticamente (defaultOpen)

**`src/components/layout/Topbar.tsx`**
- Adicionar `SidebarTrigger` para colapsar/expandir a sidebar

---

### Fase 2 — Sub-Navegação em Abas Horizontais

**`src/components/layout/ModuleNavGrid.tsx`**
- Transformar o grid de cards em abas horizontais (estilo tabs) no topo da área de conteúdo
- Cada sub-módulo vira uma aba clicável com ícone e nome
- Manter as cores semânticas por módulo
- Remover stats/sparklines dos cards (simplificar para tabs)

---

### Fase 3 — Lista de Clientes em Cards

**`src/pages/Clientes.tsx`** (rota `/clientes`)
- Substituir `<Table>` por lista de cards verticais
- Cada card: borda esquerda colorida (4px, cor do sistema), ícone, nome em destaque (uppercase), nome fantasia como subtítulo
- Exibir CNPJ, telefone, badge do sistema
- Botões de ação no canto direito (editar, excluir, atribuir técnico)
- Adicionar botão "Exportar (N)" ao lado de "Alterar em Lote"
- Adicionar botão "Filtrar" ao lado do campo de busca

**`src/pages/ClientesReceita.tsx`** (rota `/receita`)
- Mesma transformação: tabela → cards com borda lateral colorida
- Cards mostram: nome (uppercase), documento, telefone, sistema (badge colorida), status
- Botões de ação: ver detalhes, excluir
- Manter filtros existentes (status, sistema, mensalidade) mas reorganizar como botão "Filtrar" com popover

---

### Fase 4 — Componente Reutilizável de Card de Cliente

**`src/components/clientes/ClienteCard.tsx`** (novo)
- Componente reutilizável para o card de cliente
- Props: nome, nomeFantasia, documento, telefone, sistema, badgeColor, actions, onClick
- Layout: borda esquerda colorida (4px), ícone de monitor/calculadora, dados do cliente, badges, ações

---

### Detalhes Técnicos

- A `AppSidebar` já existe com toda a lógica de favoritos, busca e permissões — será adaptada de grid para lista
- Usar `Collapsible` do Radix para grupos expansíveis na sidebar
- O `ModuleNavGrid` será simplificado para tabs horizontais sem perder a navegação
- Os cards de cliente usarão `getSystemColor()` para a borda lateral
- O `ModuleNavBar` (barra de 60px com ícones) será removido do layout
- Todas as funcionalidades existentes (batch edit, CNPJ lookup, filtros, exclusão) serão preservadas

### Arquivos afetados
1. `src/components/layout/AppLayout.tsx` — trocar ModuleNavBar por SidebarProvider + AppSidebar
2. `src/components/layout/AppSidebar.tsx` — reformular de grid para lista com grupos expansíveis
3. `src/components/layout/Topbar.tsx` — adicionar SidebarTrigger
4. `src/components/layout/ModuleNavGrid.tsx` — transformar em abas horizontais
5. `src/components/clientes/ClienteCard.tsx` — novo componente de card
6. `src/pages/Clientes.tsx` — tabela → cards + botões de ação
7. `src/pages/ClientesReceita.tsx` — tabela → cards + reorganizar filtros

