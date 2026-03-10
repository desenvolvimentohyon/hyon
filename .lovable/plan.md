

## Plano: Componente de Input Monetário (BRL) com máscara automática

### Resumo

Criar um componente reutilizável `CurrencyInput` que formata valores monetários em tempo real no padrão pt-BR (R$ 1.234,56), e substituir todos os `<Input type="number">` monetários do sistema por ele.

### 1. Criar o componente `src/components/ui/currency-input.tsx`

Componente que:
- Recebe `value` (number) e `onValueChange` (callback com number)
- Internamente armazena os dígitos brutos (sem formatação)
- Ao digitar, monta o valor da direita para a esquerda: digitar `1` → `0,01`, digitar `12` → `0,12`, digitar `123` → `1,23`
- Formata com `Intl.NumberFormat('pt-BR')` para separador de milhar (`.`) e decimal (`,`)
- Ao colar valores (paste), limpa caracteres não numéricos e normaliza
- Backspace remove o último dígito
- Valor `0` exibe `0,00`
- O input será `type="text"` com `inputMode="numeric"` para mobile
- Emite o valor numérico limpo (ex: `1234.56`) via `onValueChange`

### 2. Arquivos a alterar (substituir inputs monetários)

Campos que são **valores em R$** (não percentuais, não contagem):

| Arquivo | Campos |
|---------|--------|
| `src/components/clientes/tabs/TabMensalidade.tsx` | Valor Base, Valor Final |
| `src/components/clientes/tabs/TabMensalidadeNew.tsx` | Valor Base, Valor Final |
| `src/components/clientes/tabs/TabCusto.tsx` | Custo repasse, Custo módulos, Custo cloud, Outros custos |
| `src/components/clientes/tabs/TabCustos.tsx` | Custo repasse, Custo módulos, Custo cloud, Outros custos |
| `src/components/clientes/tabs/TabPagamentos.tsx` | Valor |
| `src/pages/Clientes.tsx` | Mensalidade |
| `src/pages/ClientesReceita.tsx` | Mensalidade, Custo Mensal |
| `src/pages/Comercial.tsx` | Valor proposta |
| `src/pages/PropostaDetalhe.tsx` | Mensalidade, Implantação, valor dos itens |
| `src/pages/Parceiros.tsx` | (apenas percentuais — **não alterar**) |
| `src/pages/financeiro/Lancamentos.tsx` | Valor (receita, despesa, transferência) |
| `src/pages/financeiro/ContasPagar.tsx` | Valor pago, Valor total |
| `src/pages/financeiro/ContasReceber.tsx` | Valor recebido, Valor |
| `src/pages/Parametros.tsx` | Valor Custo, Valor Venda (sistemas e módulos) |

**Campos que NÃO serão alterados** (percentuais, contagens, dias):
- Desconto (%), Comissão (%), Parcelas, Dias, Meses, Validade, Quantidade, Dia Vencimento

### 3. Padrão de substituição

Antes:
```tsx
<Input type="number" value={valor} onChange={e => setValor(e.target.value)} />
```

Depois:
```tsx
<CurrencyInput value={Number(valor)} onValueChange={v => setValor(v)} />
```

O componente aceita as mesmas props de estilo (`className`) que o `Input` atual.

### 4. Critérios de aceite atendidos

- Zero inicial não atrapalha a digitação
- Formatação automática em tempo real (direita para esquerda)
- Colagem de valores normalizada
- Backspace funciona corretamente
- Valor numérico limpo salvo no backend
- Aplicado em todos os campos monetários do sistema

