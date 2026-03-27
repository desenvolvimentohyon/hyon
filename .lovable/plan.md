

## Plano: Remover Breadcrumb do Topbar

O usuário quer esconder as duas informações que aparecem no Topbar ao navegar em uma aba do sistema: o nome do módulo pai (ex: "Clientes e Receita") e o nome da página (ex: "Cadastro de Clientes").

### Alteração

**`src/components/layout/Topbar.tsx`**
- Remover o bloco de breadcrumb (linhas 223–244) que exibe o nome do módulo e da sub-página
- Remover o separador vertical associado
- Manter o `SidebarTrigger`, busca, notificações e demais botões intactos

### Arquivo afetado
1. `src/components/layout/Topbar.tsx`

