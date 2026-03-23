

## Plano: Alinhar tabs do ClienteDetalhe com o estilo do ModuleNavBar

### Resumo
As tabs do cadastro de clientes estão menores e com layout diferente do `ModuleNavBar`. Vou ajustar para usar o mesmo padrão visual: ícones circulares maiores (h-10 w-10) com label abaixo, dispostos em flex horizontal com `flex-col items-center`, mesmo sizing e espaçamento.

### Editar: `src/components/clientes/ClienteDetalhe.tsx`

1. **Estrutura de cada tab**: Mudar de layout inline (ícone + texto lado a lado) para layout vertical (ícone circular em cima + label embaixo) — igual ao `ModuleNavBar`
   - Ícone dentro de `div` circular `h-10 w-10 rounded-full border` com cores semânticas
   - Label com `text-[11px]` abaixo do ícone
   - Container com `flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[72px]`

2. **Tamanho dos ícones**: De `h-3.5 w-3.5` para `h-5 w-5` (mesmo do navbar)

3. **Efeitos**: Manter `hover:scale-105`, `group-hover:scale-110` no ícone, `transition-all duration-300`, glow no ativo

4. **TabsList**: Ajustar para `flex items-center justify-start gap-1 sm:gap-3` com scroll horizontal em mobile

| Arquivo | Mudança |
|---------|------|
| `src/components/clientes/ClienteDetalhe.tsx` | Reformular TabsTrigger para layout vertical com ícones circulares grandes |

