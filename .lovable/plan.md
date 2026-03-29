

## Plano: Módulo Desenvolvimento

### Resumo
Criar um novo módulo "Desenvolvimento" no menu lateral para gerenciar projetos de criação de sistemas do zero, com controle de etapas, prazos, checklist de funcionalidades e integração financeira.

### 1. Banco de Dados — 3 novas tabelas

**`dev_projects`** — Projeto principal
| Coluna | Tipo | Descrição |
|---|---|---|
| id, org_id, created_at, updated_at | padrão | — |
| client_id | uuid (nullable) | Vínculo com cliente existente |
| title | text | Nome do projeto/sistema |
| description | text | Descrição do escopo |
| status | text | `planejamento`, `em_andamento`, `pausado`, `concluido`, `cancelado` |
| plan_type | text | `mensal`, `anual`, `unico` |
| project_value | numeric | Valor total do projeto |
| monthly_value | numeric | Valor mensal (se recorrente) |
| setup_value | numeric | Valor de setup/implantação |
| started_at | date | Data de início |
| deadline_at | date | Prazo final de entrega |
| completed_at | date | Data de conclusão real |
| notes | text | Observações gerais |

**`dev_project_stages`** — Etapas do projeto
| Coluna | Tipo | Descrição |
|---|---|---|
| id, org_id, project_id, created_at | padrão | — |
| title | text | Nome da etapa |
| sort_order | integer | Ordenação |
| status | text | `pendente`, `em_andamento`, `concluida` |
| deadline_at | date | Prazo da etapa |
| completed_at | date | Data de conclusão |
| notes | text | Observações |

**`dev_project_checklist`** — Checklist de funções
| Coluna | Tipo | Descrição |
|---|---|---|
| id, org_id, project_id, stage_id (nullable), created_at | padrão | — |
| title | text | Nome da funcionalidade |
| completed | boolean | Concluído? |
| completed_at | timestamp | Quando foi concluído |
| sort_order | integer | Ordenação |

RLS: Todas com `org_id = current_org_id()`, insert/update/delete para roles admin/comercial/implantacao.

### 2. Sidebar e Rotas

**`src/lib/sidebarModules.ts`** — Adicionar módulo "Desenvolvimento" (ícone `Code2`) antes de Configurações:
- Projetos: `/desenvolvimento` — Lista de projetos
- Novo Projeto: via botão na listagem

**`src/App.tsx`** — 2 novas rotas:
- `/desenvolvimento` — Lista de projetos
- `/desenvolvimento/:id` — Detalhe do projeto

### 3. Páginas

**`src/pages/Desenvolvimento.tsx`** — Lista de projetos
- Cards/tabela com status, cliente, valor, progresso (% etapas concluídas)
- Filtros por status
- Botão "Novo Projeto" abre dialog de criação
- PageHeader com ícone Code2 e cor índigo

**`src/pages/DesenvolvimentoDetalhe.tsx`** — Detalhe do projeto com abas:
- **Dados Gerais**: Cliente, título, descrição, valores (projeto, mensal, setup), plano, datas
- **Etapas**: Lista ordenada de etapas com deadline, status e conclusão. Adicionar/editar inline
- **Checklist**: Lista de funcionalidades com checkbox, opcionalmente vinculadas a uma etapa
- **Financeiro**: Resumo de valores e botão para gerar títulos financeiros (contas a receber) no módulo financeiro existente, criando `financial_titles` com origin `desenvolvimento`

### 4. Integração Financeira

Ao criar/atualizar um projeto, o sistema poderá gerar títulos em `financial_titles`:
- Setup: título único com `type = 'receita'` e `origin = 'desenvolvimento'`
- Mensalidades: títulos recorrentes conforme o plano (mensal ou parcelas anuais)
- Vinculados ao `client_id` do projeto

### 5. Permissões

Adicionar em `src/types/users.ts`:
```
desenvolvimento: {
  label: "Desenvolvimento",
  acoes: [visualizar, criar, editar, excluir]
}
```

E em `ROTA_PERMISSAO`: `/desenvolvimento` → `desenvolvimento:visualizar`

### Arquivos Afetados
| Arquivo | Alteração |
|---|---|
| Migração SQL | 3 tabelas + RLS |
| `src/lib/sidebarModules.ts` | Novo módulo "Desenvolvimento" |
| `src/App.tsx` | 2 rotas novas |
| `src/pages/Desenvolvimento.tsx` | **Novo** — Lista de projetos |
| `src/pages/DesenvolvimentoDetalhe.tsx` | **Novo** — Detalhe com abas |
| `src/types/users.ts` | Permissões do módulo |
| `src/hooks/useDevProjects.ts` | **Novo** — Hook CRUD para projetos |

