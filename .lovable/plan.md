

## Plano: Fotos e Observações em Tarefas

### Resumo
Adicionar a possibilidade de anexar fotos (upload real para Storage) e campo de observações dentro de tarefas, tanto na criação quanto na edição/detalhe.

### 1. Criar bucket de Storage: `task-attachments`
- Migration SQL para criar bucket `task-attachments` (privado) com RLS policies permitindo upload/leitura por usuários autenticados da mesma org.

### 2. Editar: `src/types/index.ts`
- Adicionar campo `observacoes?: string` na interface `Tarefa`
- Adicionar campo `fotos?: { id: string; url: string; nome: string }[]` na interface `Tarefa`

### 3. Editar: `src/contexts/AppContext.tsx`
- Em `tarefaToDb`: incluir `observacoes` e `fotos` no `metadata`
- Em `dbToTarefa`: ler `observacoes` e `fotos` do metadata

### 4. Editar: `src/pages/Tarefas.tsx` (Modal Nova Tarefa)
- Adicionar campo `Textarea` para "Observações" (opcional)
- Adicionar input de upload de fotos (múltiplas, aceita imagem/*) com preview em miniatura
- Upload via `supabase.storage.from('task-attachments')` ao criar a tarefa
- Salvar array de fotos no metadata

### 5. Editar: `src/pages/TarefaDetalhe.tsx`
- Na aba "Resumo": exibir observações abaixo da descrição
- Na aba "Resumo": exibir galeria de fotos com thumbnails clicáveis
- Permitir adicionar novas fotos e editar observações no detalhe

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Criar bucket `task-attachments` + RLS |
| `src/types/index.ts` | Campos `observacoes` e `fotos` |
| `src/contexts/AppContext.tsx` | Propagar novos campos no metadata |
| `src/pages/Tarefas.tsx` | Upload de fotos + observações no modal |
| `src/pages/TarefaDetalhe.tsx` | Exibir/editar fotos e observações |

