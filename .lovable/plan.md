

## Plano: Templates de Etapas e Checklist para Desenvolvimento

### Resumo
Criar uma tabela `dev_templates` no banco para armazenar templates com etapas e checklist pré-definidos. Adicionar uma aba "Desenvolvimento" nas Configurações para gerenciar esses templates. Ao criar um projeto, permitir selecionar um template que popula automaticamente as etapas e checklist.

### 1. Nova tabela: `dev_templates`
```sql
CREATE TABLE public.dev_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  stages jsonb NOT NULL DEFAULT '[]',
  -- formato: [{ "title": "...", "sort_order": 0 }]
  checklist jsonb NOT NULL DEFAULT '[]',
  -- formato: [{ "title": "...", "stage_index": 0, "sort_order": 0 }]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dev_templates ENABLE ROW LEVEL SECURITY;
```
- RLS: select/insert/update/delete para org autenticada com permissão de desenvolvimento
- Etapas e checklist armazenados como JSON dentro do template (simples, sem tabelas extras)

### 2. Nova aba nas Configurações
- Adicionar item "Desenvolvimento" no `subtabItems` com ícone `Code2`
- Componente `TabDesenvolvimento` (novo arquivo `src/components/configuracoes/TabDesenvolvimento.tsx`):
  - Lista de templates com nome e quantidade de etapas/checklist
  - Dialog para criar/editar template:
    - Nome e descrição
    - Lista de etapas (adicionar/remover/reordenar)
    - Para cada etapa, lista de itens de checklist
  - Botão excluir template

### 3. Hook `useDevTemplates`
- Novo hook em `src/hooks/useDevTemplates.ts`
- CRUD básico na tabela `dev_templates`

### 4. Aplicar template ao criar projeto
- Em `Desenvolvimento.tsx`, no dialog de criação:
  - Adicionar Select "Template" (opcional) que carrega os templates disponíveis
  - Ao criar o projeto com template selecionado, após o `createProject` retornar com sucesso:
    - Buscar o ID do projeto recém-criado
    - Inserir as etapas do template em `dev_project_stages`
    - Inserir os itens de checklist em `dev_project_checklist`, vinculando ao `stage_id` correto

### 5. Ajuste no `useDevProjects.createProject`
- Retornar o ID do projeto criado (em vez de apenas `true`) para permitir a inserção das etapas/checklist logo após a criação

### Impacto
- 1 migração (tabela + RLS)
- 3 arquivos novos (hook, componente configuração, subtab entry)
- 2 arquivos editados (`Configuracoes.tsx`, `Desenvolvimento.tsx`, `useDevProjects.ts`)

