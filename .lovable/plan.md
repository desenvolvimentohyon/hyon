

## Plano: Sidebar com módulos em formato de cards com ícones grandes

### Resumo
Transformar a lista de módulos na sidebar em um grid de cards com ícones grandes circulares e labels abaixo, seguindo o visual do print enviado (estilo "atalhos"). Quando expandida, a sidebar mostra os módulos como cards em grid 2x; quando colapsada, mantém o comportamento atual com ícones pequenos.

### Editar: `src/components/layout/AppSidebar.tsx`

1. **Substituir a lista flat de módulos** pelo grid de cards com ícones grandes:
   - Cada módulo renderizado como card com ícone circular grande (~48px) e label abaixo
   - Grid de 2 colunas quando sidebar expandida
   - Separadores verticais sutis entre colunas (como no print)
   - Background translúcido/glass no container do grid

2. **Estilo dos cards**:
   - Ícone dentro de círculo com borda sutil (`border rounded-full`)
   - Label do módulo abaixo do ícone, centralizado
   - Hover e active states com as cores semânticas já definidas em `MODULE_SIDEBAR_COLORS`
   - Sem descrição — apenas ícone + nome

3. **Manter intactos**:
   - Header com logo
   - Busca de módulos
   - Seção de favoritos
   - Footer com avatar do usuário
   - Comportamento colapsado (ícones pequenos empilhados)

### Resultado
A sidebar expandida terá visual de grid de cards com ícones grandes circulares, semelhante ao print de referência, mantendo a navegação funcional e o mesmo padrão de cores por módulo.

| Arquivo | Mudança |
|---------|---------|
| `src/components/layout/AppSidebar.tsx` | Reformular área de módulos para grid de cards com ícones grandes |

