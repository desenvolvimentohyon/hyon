

## Plano: Mover anexos da aba própria para a aba Contabilidade

### O que muda

1. **Remover aba "Anexos"** do `ClienteDetalhe.tsx`
   - Remover do array `TABS` a entrada `{ value: "anexos", ... }`
   - Remover o `TabsContent value="anexos"` correspondente
   - Remover `TAB_COLORS.anexos`
   - Remover import de `TabAnexos` e do ícone `Paperclip`

2. **Adicionar seção de anexos dentro de `TabContabilidade.tsx`**
   - Adicionar props `clienteId`, `orgId`, `attachments`, `onAdd`, `onDelete` ao componente
   - Importar e reutilizar o componente `TabAnexos` como uma seção dentro da aba, após "Observações Fiscais"
   - Alternativa: embutir o upload/listagem diretamente (mas reutilizar `TabAnexos` é mais limpo)

3. **Atualizar chamada de `TabContabilidade`** em `ClienteDetalhe.tsx`
   - Passar as props extras: `clienteId`, `orgId={cliente?.org_id}`, `attachments`, `onAdd={addAttachment}`, `onDelete={deleteAttachment}`

### Arquivos alterados
- `src/components/clientes/ClienteDetalhe.tsx` — remover aba anexos, passar props para contabilidade
- `src/components/clientes/tabs/TabContabilidade.tsx` — receber props e renderizar `TabAnexos` como seção

