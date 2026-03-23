

## Plano: Adicionar cores e transições aos ícones do ModuleNavBar

### Resumo
Aprimorar o `ModuleNavBar` para que os ícones sempre mostrem suas cores semânticas (não apenas quando ativos), adicionar glow/shadow colorido no estado ativo, e melhorar as transições nos ícones e labels.

### Editar: `src/components/layout/ModuleNavBar.tsx`

1. **Cores dos ícones sempre visíveis**: No estado inativo, os ícones passam a usar a cor semântica do módulo (com opacidade reduzida) em vez de `text-muted-foreground`. No hover, a cor fica 100%.

2. **Glow colorido no ativo**: Adicionar `shadow` colorido no círculo do ícone quando ativo (ex: `shadow-[0_0_12px_rgba(...)]]`), usando CSS inline por módulo.

3. **Transições suaves**: Expandir `transition-all duration-200` para incluir `transition-all duration-300` nos círculos dos ícones e labels, com efeito de scale no hover do ícone.

4. **Expandir `MODULE_COLORS`** para incluir `hoverColor` e `shadow` (para o glow).

### Resultado
Cada módulo terá sua cor semântica sempre visível nos ícones, com transições fluidas e efeito de glow quando ativo — visual mais rico e consistente.

| Arquivo | Mudança |
|---------|------|
| `src/components/layout/ModuleNavBar.tsx` | Cores permanentes nos ícones, glow ativo, transições |

