

## Plano: Reorganizar Navegação em Módulos Mãe e Submódulos (ERP)

### O que muda

1. **Reorganizar o array `modules` no AppSidebar** com a nova estrutura hierárquica solicitada
2. **Adicionar busca no topo da sidebar** (filtro de módulos/submódulos)
3. **Adicionar sistema de favoritos** (localStorage, com seção "Favoritos" no topo)
4. **Adicionar breadcrumbs automáticos** no Topbar baseado na rota ativa

### Arquivos a editar

| Arquivo | Ação |
|---------|------|
| `src/components/layout/AppSidebar.tsx` | **Editar** — nova estrutura de módulos, busca, favoritos |
| `src/components/layout/Topbar.tsx` | **Editar** — adicionar breadcrumbs automáticos |

### Nova estrutura de módulos

```text
Dashboard          → / (direto, sem submódulos)
  └ Visão Geral    → /
  └ Painel Executivo → /executivo

Clientes
  └ Cadastro       → /clientes
  └ Receita / MRR  → /receita
  └ Checkout       → /checkout-interno

Comercial
  └ Propostas      → /propostas
  └ CRM            → /crm
  └ Painel Comercial → /comercial
  └ Parceiros      → /parceiros

Financeiro
  └ Visão Geral    → /financeiro
  └ Contas a Receber → /financeiro/contas-a-receber
  └ Contas a Pagar → /financeiro/contas-a-pagar
  └ Lançamentos    → /financeiro/lancamentos
  └ Plano de Contas → /financeiro/plano-de-contas
  └ Conciliação    → /financeiro/conciliacao-bancaria
  └ Relatórios     → /financeiro/relatorios
  └ Configurações  → /financeiro/configuracoes

Suporte & Operacional
  └ Suporte        → /suporte
  └ Tarefas        → /tarefas
  └ Implantação    → /implantacao
  └ Técnicos       → /tecnicos

Cartões
  └ Dashboard      → /cartoes
  └ Clientes       → /cartoes/clientes
  └ Propostas      → /cartoes/propostas
  └ Faturamento    → /cartoes/faturamento

Configurações
  └ Minha Empresa  → /configuracoes
  └ Usuários       → /usuarios
```

Todas as rotas existentes permanecem inalteradas. Apenas a organização visual do menu muda.

### Busca no sidebar

Input no topo da sidebar (abaixo do logo) que filtra módulos e submódulos pelo título. Quando colapsado, o input não aparece.

### Favoritos (localStorage)

- Cada submódulo terá um ícone de estrela ao lado (hover)
- Favoritos salvos em `localStorage` com key `sidebar-favorites`
- Seção "Favoritos" aparece no topo do menu se houver itens marcados
- Limite de 8 favoritos

### Breadcrumbs automáticos

Adicionar no Topbar, logo após o `SidebarTrigger`, um breadcrumb baseado no mapa de rotas:
- Usa o mesmo array `modules` para determinar `Módulo Mãe > Submódulo`
- Ex: `Comercial > Propostas > Nova Proposta`
- Rotas com parâmetros (`:id`) mostram o nome genérico

### O que NÃO muda
- Nenhuma rota
- Nenhuma lógica de negócio
- Nenhum banco de dados
- Nenhuma funcionalidade removida
- Comportamento de permissões (canAccess) permanece igual

