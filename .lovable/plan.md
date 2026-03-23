

## Plano: Aplicar navegação em cards (ModuleNavGrid) em todo o sistema

### Conceito
Criar um componente reutilizável `ModuleNavGrid` que renderiza cards de navegação para os submódulos de cada área, usando o mesmo padrão visual do `SubtabGrid` já existente em Configurações. O componente lê os dados de `sidebarModules.ts` e destaca a rota ativa.

### 1. Novo componente: `ModuleNavGrid`

**Arquivo: `src/components/layout/ModuleNavGrid.tsx`**

Componente que recebe o `moduleId` (ex: "clientes", "comercial"), busca os children do módulo em `sidebarModules.ts`, e renderiza cards clicáveis com:
- Ícone do submódulo
- Título e descrição (tooltip)
- Grid responsivo: 5 colunas desktop, 3 tablet, 1-2 mobile
- Card ativo destacado (borda + glow) baseado na rota atual (`useLocation`)
- Hover com iluminação suave, transições de 200ms
- `useNavigate` no click para ir à rota

Cores semânticas por módulo (mesma paleta dos PageHeaders existentes):
- Dashboard: primary/blue
- Clientes: emerald
- Comercial: indigo
- Financeiro: green
- Suporte: orange
- Cartões: purple

### 2. Adicionar descrições aos submódulos

**Arquivo: `src/lib/sidebarModules.ts`**

Adicionar campo `description` a cada `SubModule` para exibir nos tooltips e subtítulos dos cards.

Exemplos:
- "Cadastro de Clientes" → "Gestão e cadastro de clientes"
- "Receita / MRR" → "Receita recorrente mensal"
- "CRM" → "Pipeline e funil de vendas"

### 3. Inserir o grid em cada página principal

Adicionar `<ModuleNavGrid moduleId="..." />` logo após o `<PageHeader>` nas seguintes páginas:

| Página | moduleId | Arquivo |
|--------|----------|---------|
| Dashboard | dashboard | `src/pages/Dashboard.tsx` |
| Clientes | clientes | `src/pages/Clientes.tsx` |
| Receita | clientes | `src/pages/Receita.tsx` |
| Checkout Interno | clientes | `src/pages/CheckoutInterno.tsx` |
| Propostas | comercial | `src/pages/Propostas.tsx` |
| CRM | comercial | `src/pages/CRM.tsx` |
| Comercial | comercial | `src/pages/Comercial.tsx` |
| Parceiros | comercial | `src/pages/Parceiros.tsx` |
| Financeiro (todas) | financeiro | `src/pages/financeiro/*.tsx` (8 arquivos) |
| Suporte | operacional | `src/pages/Suporte.tsx` |
| Tarefas | operacional | `src/pages/Tarefas.tsx` |
| Implantação | operacional | `src/pages/Implantacao.tsx` |
| Técnicos | operacional | `src/pages/Tecnicos.tsx` |
| Cartões (todas) | cartoes | `src/pages/cartoes/*.tsx` (4 arquivos) |
| Configurações | configuracoes | Já possui SubtabGrid, manter |

### 4. Detalhes técnicos

- O componente usa `useLocation` para detectar a rota ativa e `useNavigate` para navegação
- Tooltips com `TooltipProvider/Tooltip` mostram a descrição ao hover
- Animação de entrada `animate-fade-in` nos cards
- Nenhuma alteração de rotas, banco de dados ou funcionalidades existentes
- ~22 arquivos editados no total (1 novo componente + 1 atualização de tipos + ~20 páginas)

### Arquivos editados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/sidebarModules.ts` | Adicionar `description` ao tipo `SubModule` e a cada item |
| `src/components/layout/ModuleNavGrid.tsx` | **Novo** — componente de navegação em cards |
| ~20 páginas | Inserir `<ModuleNavGrid>` após PageHeader |

