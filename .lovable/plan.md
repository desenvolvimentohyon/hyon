

## Plano: Corrigir permissão de exclusão e adicionar aba Usuários em Configurações

### Problema 1 — Exclusão bloqueada por RLS
A política UPDATE da tabela `clients` exige `current_role()` ser `admin`, `comercial`, `suporte` ou `implantacao`. Se o usuário não tem uma dessas roles no campo `profiles.role`, o soft-delete falha silenciosamente. A solução é atualizar a política para aceitar também `has_permission('clientes:cancelar')`.

### Problema 2 — Gestão de usuários fora de Configurações
A página `UsuariosConfig` já existe mas não está acessível dentro de Configurações Gerais. O usuário quer uma aba "Usuários" dentro de Configurações com perfis pré-definidos (Administrador, Técnico, Vendedor) e a matriz de permissões granulares.

### Alterações

**1. Migração SQL — Atualizar política UPDATE da tabela `clients`**
```sql
DROP POLICY "org_update" ON public.clients;
CREATE POLICY "org_update" ON public.clients
  FOR UPDATE TO authenticated
  USING (
    org_id = current_org_id() 
    AND (
      current_role() = ANY(ARRAY['admin','comercial','suporte','implantacao'])
      OR has_permission('clientes:editar')
      OR has_permission('clientes:cancelar')
    )
  );
```

**2. `src/pages/Configuracoes.tsx`**
- Adicionar item "Usuários" ao `subtabItems` (ícone `Users`)
- Adicionar `<TabsContent value="usuarios">` que renderiza o componente `UsuariosConfig` (lazy-loaded)

**3. `src/contexts/UsersContext.tsx`**
- Garantir que os 3 perfis padrão pré-definidos existam: `admin` → "Administrador", `suporte` → "Técnico", `comercial` → "Vendedor" — com permissões já mapeadas
- O perfil "Administrador" terá todas as permissões

### Detalhes técnicos
- A função `has_permission()` já existe como `SECURITY DEFINER` e consulta `custom_roles.permissions` — sem risco de recursão
- Perfis padrão (`DEFAULT_ROLE_PERMISSIONS`) já existem no `UsersContext` com as keys `admin`, `comercial`, `suporte` — apenas renomear labels para "Administrador", "Técnico", "Vendedor"
- O `UsuariosConfig` já tem a matriz de permissões com checkboxes granulares por módulo — será reaproveitado

