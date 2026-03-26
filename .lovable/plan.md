

## Plano: Adicionar botão "Nova Conta" no select de Categoria

### Alteração

**`src/pages/financeiro/Lancamentos.tsx`** — componente `LancamentoForm`, linhas 87-92

1. Importar `useNavigate` do `react-router-dom` e o ícone `FolderTree`
2. Envolver o `Select` de categoria em um `div` com `flex` e adicionar um botão ao lado que navega para `/financeiro/plano-de-contas`
3. O botão terá um ícone `Plus` com tooltip/title "Criar nova conta no Plano de Contas"

### Resultado

O campo de categoria terá um botão `+` ao lado que leva o usuário diretamente à página do Plano de Contas para criar uma nova conta.

### Detalhe técnico

```tsx
<div>
  <Label>Categoria</Label>
  <div className="flex gap-2">
    <Select value={catId} onValueChange={setCatId}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>...</SelectContent>
    </Select>
    <Button variant="outline" size="icon" className="shrink-0"
      onClick={() => navigate("/financeiro/plano-de-contas")}
      title="Criar nova conta">
      <Plus className="h-4 w-4" />
    </Button>
  </div>
</div>
```

