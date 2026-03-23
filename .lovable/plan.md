

## Plano: Adicionar opção "Módulo Global" no catálogo de módulos

### Resumo
Adicionar um campo `is_global` na tabela `system_modules` e uma opção no formulário de módulos para marcar um módulo como "Global" — ou seja, ele aparece para todos os sistemas, sem precisar estar vinculado a um sistema específico.

### 1. Migration SQL — Novo campo `is_global`

```sql
ALTER TABLE public.system_modules ADD COLUMN is_global boolean NOT NULL DEFAULT false;
```

### 2. Editar: `src/types/parametros.ts`

Adicionar `isGlobal?: boolean` ao tipo `ModuloCatalogo`.

### 3. Editar: `src/contexts/ParametrosContext.tsx`

- Mapper `dbToModulo`: mapear `r.is_global` para `isGlobal`
- `addModulo`: enviar `is_global: m.isGlobal || false`
- `updateModulo`: enviar `is_global` se alterado

### 4. Editar: `src/pages/Parametros.tsx`

- **Formulário do módulo (modal)**: Adicionar um `Switch` "Módulo Global" acima do select de sistema. Quando ativo, o select de sistema fica desabilitado/oculto (pois o módulo se aplica a todos).
- **Estado `fModulo`**: Adicionar `isGlobal: false`
- **Tabela de módulos**: Na coluna "Sistema", exibir badge "Global" quando `isGlobal === true` em vez do nome do sistema.
- **`saveModulo`**: Se `isGlobal`, setar `sistemaId` como vazio.

### 5. Editar: `src/pages/Configuracoes.tsx`

Mesmas mudanças do formulário e tabela de módulos (replica a lógica de Parametros).

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `is_global boolean DEFAULT false` em `system_modules` |
| `src/types/parametros.ts` | `isGlobal` no tipo |
| `src/contexts/ParametrosContext.tsx` | Mapper + CRUD com `is_global` |
| `src/pages/Parametros.tsx` | Switch "Global" no form + badge na tabela |
| `src/pages/Configuracoes.tsx` | Mesma lógica do form/tabela |

