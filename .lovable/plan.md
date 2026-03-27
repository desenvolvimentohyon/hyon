

## Plano: Corrigir Tela em Branco (Erro de instância duplicada do React)

### Problema
O erro `Cannot read properties of null (reading 'useEffect')` no `QueryClientProvider` indica que o Vite está carregando duas instâncias separadas do React — uma diretamente e outra via dependências (Radix UI, React Query, etc.). Quando um componente usa hooks de uma instância diferente da que renderizou a árvore, os hooks falham com esse erro.

### Causa raiz
O `resolve.dedupe` já foi adicionado, mas não é suficiente sozinho. O Vite precisa também pré-otimizar o React em um único bundle via `optimizeDeps` para garantir que todas as dependências compartilhem a mesma instância.

Vários pacotes Radix UI estão em versões altas (`^1.1.x`, `^2.2.x`) que podem trazer internos que referenciam React de forma separada durante o dev server.

### Correção

**`vite.config.ts`** — Adicionar `optimizeDeps.include` para forçar o Vite a pré-empacotar React em um único módulo:

```typescript
optimizeDeps: {
  include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
},
```

Isso garante que todas as dependências (Radix, React Query, React Router, etc.) resolvam para a mesma cópia do React durante o desenvolvimento.

### Arquivo afetado
1. `src/vite.config.ts` — adicionar bloco `optimizeDeps`

