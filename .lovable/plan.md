

## Plano: Ações inline com ícones e tooltips na tabela de propostas

### Problema
Atualmente as ações da proposta ficam dentro de um dropdown menu (⋯). O usuário quer que as ações principais fiquem como ícones inline na mesma linha, com tooltip ao passar o cursor.

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/pages/Propostas.tsx` | Substituir o DropdownMenu por ícones inline com Tooltip, agrupados em seções visuais com separadores |

### Detalhes

1. **Substituir DropdownMenu por ícones inline** (linhas 241-261):
   - Remover `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`
   - Criar uma `div flex gap-0.5` com botões `ghost` `size="icon"` (`h-7 w-7`)
   - Cada botão envolto em `<Tooltip>` do shadcn mostrando o nome da ação no hover

2. **Ícones na ordem da screenshot** (com separadores visuais `border-l`):
   - **Grupo 1**: Abrir (`FileText`), Clonar (`Copy`), Baixar PDF (`Download`), Copiar Link (`ExternalLink`), WhatsApp (`MessageCircle`)
   - **Grupo 2** (separador): Marcar Enviada (`Send`), Marcar Visualizada (`Eye`), Marcar Não Abriu (`EyeOff`), Marcar Aceita (`ThumbsUp`), Marcar Recusada (`ThumbsDown`)
   - **Grupo 3** (separador): Excluir (`Trash2`) em vermelho

3. **Tooltip**: Usar `<TooltipProvider>` + `<Tooltip>` + `<TooltipTrigger>` + `<TooltipContent>` do shadcn para exibir o nome ao hover

4. **Imports**: Adicionar `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger` de `@/components/ui/tooltip`; remover imports do DropdownMenu não mais usados

