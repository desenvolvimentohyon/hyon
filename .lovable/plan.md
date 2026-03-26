

## Plano: Dia de vencimento com opções fixas (3, 5 e 7)

### O que muda

Substituir o campo numérico livre "Dia de Vencimento" por um `Select` com apenas 3 opções: dia 3, dia 5 e dia 7.

### Arquivos alterados

**1. `src/components/clientes/tabs/TabMensalidadeNew.tsx` (linha 68)**
- Trocar o `<Input type="number">` por um `<Select>` com 3 opções: `3`, `5`, `7`
- Default: `5` (ao invés de 10)

**2. `src/components/clientes/tabs/TabMensalidade.tsx` (linha 70)**
- Mesma alteração: trocar `<Input type="number">` por `<Select>` com opções 3, 5 e 7
- Ajustar default de 10 para 5

### Detalhes técnicos
```tsx
<Select value={String(formData.default_due_day ?? cliente.default_due_day ?? 5)}
        onValueChange={v => onChange({ default_due_day: Number(v) } as any)}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="3">Dia 3</SelectItem>
    <SelectItem value="5">Dia 5</SelectItem>
    <SelectItem value="7">Dia 7</SelectItem>
  </SelectContent>
</Select>
```

