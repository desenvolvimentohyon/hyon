

## Plano: Remover signup público e manter apenas login

O sistema já tem gestão de usuários via `UsuariosConfig.tsx` e o `addUser` no `UsersContext` já exibe apenas um toast informativo. O signup público na tela de login é o único ponto de entrada não controlado.

### Alterações

#### 1. `src/pages/Auth.tsx`
- Remover todo o estado e lógica de signup (`isLogin`, `fullName`, `signUp`, toggle de modo)
- Manter apenas o formulário de login (e-mail + senha + botão "Entrar")
- Remover imports não utilizados (`User`, `signUp`)
- O título ficará fixo: "Entrar na plataforma"

#### 2. `src/contexts/AuthContext.tsx`
- Remover o método `signUp` do contexto e da interface `AuthContextType`
- Isso garante que nenhum outro ponto do código possa chamar signup acidentalmente

### Arquivos afetados

| Arquivo | Alteração |
|---|---|
| `src/pages/Auth.tsx` | Remover formulário de cadastro, manter apenas login |
| `src/contexts/AuthContext.tsx` | Remover método `signUp` |

### Resultado
A tela de login mostrará apenas e-mail e senha. Novos usuários só poderão ser adicionados por administradores via a tela de configurações de usuários.

