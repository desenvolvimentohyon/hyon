

## Plano: Sistema do cliente deve vir dos Parâmetros (catálogo dinâmico)

### Problema atual
Os campos "Sistema" nas telas de cliente estão hardcoded (`"hyon"`, `"linkpro"`, `"PDV+"`, etc.) ou são inputs de texto livre. O correto e trazer os sistemas cadastrados na tabela `systems_catalog` (Parâmetros) e, ao selecionar um sistema, preencher automaticamente o valor de venda configurado.

### Locais a alterar

| Arquivo | Campo atual | Mudanca |
|---------|------------|---------|
| `src/pages/Clientes.tsx` (modal novo cliente) | Select hardcoded `hyon`/`linkpro` | Select dinamico do catalogo + preencher mensalidade ao selecionar |
| `src/components/clientes/tabs/TabDados.tsx` | Input texto livre `system_name` | Select dinamico do catalogo + preencher `monthly_value_base` ao selecionar |
| `src/components/clientes/tabs/TabGeral.tsx` | Input texto livre `system_name` | Select dinamico do catalogo |
| `src/components/clientes/tabs/TabCusto.tsx` | Input texto livre `cost_system_name` | Select dinamico do catalogo |
| `src/components/clientes/tabs/TabCustos.tsx` | Input texto livre `cost_system_name` | Select dinamico do catalogo |

### Implementacao

1. **Cada componente acima** vai importar `useParametros` do `ParametrosContext` para obter a lista `sistemas` (que vem da tabela `systems_catalog`).

2. **Substituir** os `<Input>` e `<Select>` hardcoded por um `<Select>` dinamico:
```tsx
const { sistemas } = useParametros();
const sistemasAtivos = sistemas.filter(s => s.ativo);

<Select value={systemName} onValueChange={handleSystemChange}>
  <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
  <SelectContent>
    {sistemasAtivos.map(s => (
      <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

3. **Auto-preencher valor** ao selecionar sistema (nos locais relevantes):
   - Em `Clientes.tsx` (novo cliente): ao selecionar sistema, setar `mensalidade` com `valorVenda` do sistema
   - Em `TabDados.tsx`: ao selecionar sistema, setar `monthly_value_base` com `valorVenda`
   - Em `TabCusto.tsx` / `TabCustos.tsx`: ao selecionar sistema de custo, setar `monthly_cost_value` com `valorCusto`

4. **Tipo `SistemaRelacionado`** em `src/types/index.ts`: remover o enum hardcoded e usar `string` para aceitar qualquer nome do catalogo.

### Arquivos editados
- `src/types/index.ts` -- mudar `SistemaRelacionado` para `string`
- `src/pages/Clientes.tsx` -- select dinamico + auto-valor
- `src/components/clientes/tabs/TabDados.tsx` -- select dinamico + auto-valor
- `src/components/clientes/tabs/TabGeral.tsx` -- select dinamico
- `src/components/clientes/tabs/TabCusto.tsx` -- select dinamico + auto-custo
- `src/components/clientes/tabs/TabCustos.tsx` -- select dinamico + auto-custo

