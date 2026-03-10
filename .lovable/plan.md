

## Plano: Remover sistemas hardcoded restantes

Ainda existem 3 arquivos com selects de sistema hardcoded (`hyon`, `linkpro`, `HYON`, `LINKPRO`). Os arquivos `Clientes.tsx`, `TabDados.tsx`, `TabGeral.tsx`, `TabCusto.tsx` e `TabCustos.tsx` já foram corrigidos anteriormente.

### Arquivos a corrigir

| Arquivo | Situação atual |
|---------|---------------|
| `src/pages/Comercial.tsx` | Select hardcoded `hyon`/`linkpro` no modal "Novo Lead" |
| `src/pages/PropostaDetalhe.tsx` | Select hardcoded `HYON`/`LINKPRO`/`OUTRO` |
| `src/pages/Tarefas.tsx` | Filtro hardcoded `hyon`/`linkpro` |

### Implementacao

1. **`src/pages/Comercial.tsx`** -- Importar `useParametros`, substituir o Select hardcoded por lista dinamica de `sistemasAtivos`. Ao selecionar, preencher `valorProposta` com `valorVenda` do sistema.

2. **`src/pages/PropostaDetalhe.tsx`** -- Importar `useParametros`, substituir Select hardcoded por lista dinamica. Manter compatibilidade com valores existentes (uppercase).

3. **`src/pages/Tarefas.tsx`** -- Importar `useParametros`, substituir filtro hardcoded por lista dinamica de sistemas + opção "Todos".

### Padrao aplicado (igual aos arquivos ja corrigidos)

```tsx
const { sistemas } = useParametros();
const sistemasAtivos = sistemas.filter(s => s.ativo);

<Select value={value} onValueChange={handleChange}>
  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
  <SelectContent>
    {sistemasAtivos.map(s => (
      <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

