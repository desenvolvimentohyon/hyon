

## Plano: Vincular módulos ao cliente com base no sistema selecionado

### Resumo
Quando o usuário seleciona um sistema na aba Dados do cliente, exibir automaticamente os módulos vinculados àquele sistema como checkboxes, permitindo marcar quais módulos o cliente contratou.

### 1. Nova tabela `client_modules` (migration)

```sql
CREATE TABLE public.client_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.system_modules(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, module_id)
);

ALTER TABLE public.client_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cm_select" ON public.client_modules FOR SELECT TO authenticated
  USING (org_id = current_org_id());

CREATE POLICY "cm_insert" ON public.client_modules FOR INSERT TO authenticated
  WITH CHECK (org_id = current_org_id() AND current_role() = ANY(ARRAY['admin','comercial','suporte','implantacao']));

CREATE POLICY "cm_delete" ON public.client_modules FOR DELETE TO authenticated
  USING (org_id = current_org_id() AND current_role() = ANY(ARRAY['admin','comercial','suporte','implantacao']));
```

### 2. Atualizar `TabDados.tsx`

- Importar `supabase` e `useAuth` para obter `org_id`
- Carregar os módulos do catálogo filtrados pelo `system_id` do sistema selecionado (usando `useParametros().modulos`)
- Carregar os módulos já vinculados ao cliente da tabela `client_modules`
- Quando o sistema muda, atualizar a lista de módulos disponíveis
- Renderizar uma seção "Módulos do Sistema" logo abaixo do campo Sistema, com checkboxes para cada módulo ativo
- Ao marcar/desmarcar, inserir/deletar na tabela `client_modules` imediatamente (sem depender do botão Salvar, pois é uma relação N:N separada)

### 3. Atualizar `TabModulos.tsx`

- Filtrar para mostrar apenas os módulos vinculados ao cliente (da tabela `client_modules`) em vez de todos os módulos do catálogo

### Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Criar tabela `client_modules` com RLS |
| `src/components/clientes/tabs/TabDados.tsx` | Adicionar seção de módulos com checkboxes filtrados por sistema |
| `src/components/clientes/tabs/TabModulos.tsx` | Mostrar apenas módulos vinculados ao cliente |

