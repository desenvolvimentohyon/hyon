

## Correção: Erro ao registrar despesa

### Problema
Na linha 75 de `Lancamentos.tsx`, o campo `contaBancariaId` está hardcoded como `"cb1"`, que não é um UUID válido. Ao inserir no banco, o campo `bank_account_id` recebe esse valor inválido e a operação falha.

### Solução
Substituir o valor fixo `"cb1"` por `null` (já que o campo é nullable no banco) ou, melhor ainda, permitir que o usuário selecione uma conta bancária no formulário.

### Alteração

**`src/pages/financeiro/Lancamentos.tsx`**

1. Adicionar state para conta bancária selecionada, inicializando com a primeira conta disponível ou string vazia
2. Adicionar um campo `Select` de "Conta Bancária" no formulário
3. No `handleSave`, enviar `contaBancariaId` como o valor selecionado ou `null`

```tsx
// Novo state
const [contaBancariaId, setContaBancariaId] = useState(
  contasBancarias.length > 0 ? contasBancarias[0].id : ""
);

// No handleSave, linha 75 — de:
contaBancariaId: "cb1",
// para:
contaBancariaId: contaBancariaId || null,

// Novo campo Select no grid do formulário:
<div>
  <Label>Conta Bancária</Label>
  <Select value={contaBancariaId} onValueChange={setContaBancariaId}>
    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
    <SelectContent>
      {contasBancarias.map(c => (
        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

