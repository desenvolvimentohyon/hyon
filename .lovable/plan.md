

## Plano: Remover descrição da aba ativa no detalhe do cliente

O usuário quer aplicar a mesma lógica da remoção do breadcrumb do Topbar — eliminar informações descritivas/redundantes.

No componente `ClienteDetalhe.tsx`, há uma linha de texto descritivo abaixo das abas (ex: "Informações cadastrais, endereço e contatos") que será removida.

### Alteração

**`src/components/clientes/ClienteDetalhe.tsx`**
- Remover o bloco de descrição da aba ativa (linhas 232–234):
  ```tsx
  {currentTabMeta && (
    <p className="text-xs text-muted-foreground mt-2 mb-4">{currentTabMeta.desc}</p>
  )}
  ```
- Remover a variável `currentTabMeta` (linha 130) e o campo `desc` de cada item do array `TABS` (linhas 46–55), já que não serão mais utilizados.

### Arquivo afetado
1. `src/components/clientes/ClienteDetalhe.tsx`

