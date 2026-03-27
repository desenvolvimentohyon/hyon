

## Auditoria Completa do Sistema Hyon

### Achados da Auditoria

#### 1. PÁGINA FANTASMA: `src/pages/Clientes.tsx` (NUNCA USADA)
- A rota `/clientes` usa `ClientesReceita` (linha 108 do App.tsx), mas `Clientes.tsx` (494 linhas) existe como arquivo órfão
- Ambos fazem a mesma coisa (listar clientes), gerando **duplicação massiva de código**
- `Clientes.tsx` importa `ModuleNavGrid`, `ClienteDetalhe`, etc. — duplica tudo que `ClientesReceita.tsx` faz
- **Ação**: Excluir `src/pages/Clientes.tsx`

#### 2. PÁGINA FANTASMA: `src/pages/Index.tsx` (NUNCA USADA)
- Contém um template genérico "Welcome to Your Blank App" — nunca referenciada em rotas
- **Ação**: Excluir `src/pages/Index.tsx`

#### 3. PÁGINA FANTASMA: `src/pages/Parametros.tsx` (NUNCA RENDERIZADA)
- A rota `/parametros` faz redirect para `/configuracoes` (linha 122 do App.tsx)
- O arquivo `Parametros.tsx` (289 linhas) nunca é renderizado
- **Ação**: Excluir `src/pages/Parametros.tsx`

#### 4. ModuleNavGrid AUSENTE em páginas
- **Cockpit** (`/cockpit`): Não tem `ModuleNavGrid moduleId="dashboard"` — inconsistente com Dashboard, Executivo e Radar
- **CheckoutInterno** (`/checkout-interno`): Não tem `ModuleNavGrid moduleId="clientes"` — inconsistente com Clientes e Receita
- **ClientesReceita** (`/clientes`): Não tem `ModuleNavGrid moduleId="clientes"` — inconsistente com a página de Receita
- **Configurações** (`/configuracoes`): Não tem `ModuleNavGrid moduleId="configuracoes"`
- **UsuáriosConfig** (`/usuarios`): Não tem `ModuleNavGrid moduleId="configuracoes"`
- **Ação**: Adicionar `ModuleNavGrid` com o `moduleId` correto em todas essas páginas

#### 5. PERMISSÃO INCOERENTE na rota Dashboard
- `ROTA_PERMISSAO["/"]` exige `"tarefas:visualizar"` — a dashboard deveria ser acessível a todos ou ter permissão própria
- **Ação**: Remover a restrição de permissão da rota `/` (ou criar permissão dedicada)

#### 6. Rota `/usuarios` separada mas duplicada em Configurações
- `Configuracoes.tsx` importa `UsuariosConfig` como lazy component (linha 36) para uso interno
- Mas `/usuarios` também é uma rota independente no App.tsx (linha 121)
- A sidebar trata como sub-item de Configurações, o que funciona, mas o componente é carregado em dois contextos
- **Ação**: Baixa prioridade — manter como está (funciona nos dois caminhos)

#### 7. Console Error: AlertDialogContent ref warning
- `AlertDialogContent` em `ClientesReceita.tsx` gera warning de ref em function component
- **Ação**: Baixa prioridade — é um warning do Radix UI, não quebra funcionalidade

---

### Plano de Correção (Priorizado)

**Arquivo 1 — Excluir `src/pages/Clientes.tsx`**
- Remover o arquivo fantasma de 494 linhas que nunca é importado

**Arquivo 2 — Excluir `src/pages/Index.tsx`**
- Remover o template placeholder de 14 linhas que nunca é importado

**Arquivo 3 — Excluir `src/pages/Parametros.tsx`**
- Remover a página de 289 linhas que nunca é renderizada (rota faz redirect)

**Arquivo 4 — `src/pages/Cockpit.tsx`**
- Adicionar `<ModuleNavGrid moduleId="dashboard" />` após o PageHeader

**Arquivo 5 — `src/pages/ClientesReceita.tsx`**
- Adicionar `<ModuleNavGrid moduleId="clientes" />` após o PageHeader
- Adicionar import do `ModuleNavGrid`

**Arquivo 6 — `src/pages/CheckoutInterno.tsx`**
- Adicionar `<ModuleNavGrid moduleId="clientes" />` após o cabeçalho
- Adicionar import do `ModuleNavGrid`

**Arquivo 7 — `src/pages/Configuracoes.tsx`**
- Adicionar `<ModuleNavGrid moduleId="configuracoes" />` após o PageHeader
- Adicionar import do `ModuleNavGrid`

**Arquivo 8 — `src/types/users.ts`**
- Remover ou alterar `"/": "tarefas:visualizar"` de `ROTA_PERMISSAO` para não restringir o Dashboard

### Resumo
- **3 arquivos fantasmas** a excluir (~797 linhas de código morto)
- **4 páginas** sem navegação de módulo (`ModuleNavGrid`) para adicionar
- **1 permissão** incoerente na rota principal
- **Total: 8 correções** em 8 arquivos

