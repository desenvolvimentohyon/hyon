

## Plano: Corrigir auto-seleção de módulos e adicionar descontos em R$ na mensalidade e implantação

### Problemas identificados
1. **Linha 98-106**: `useEffect` seleciona automaticamente todos os módulos ao trocar de sistema — deveria iniciar sem nenhum selecionado
2. **Desconto em R$**: só existe desconto em percentual, falta opção de desconto em valor fixo (R$)
3. **Implantação**: não tem campos de desconto (nem % nem R$)

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/pages/PropostaInteligente.tsx` | 3 mudanças abaixo |

#### 1. Remover auto-seleção de módulos
Alterar o `useEffect` (linhas 98-106) para apenas limpar os módulos ao trocar de sistema, sem selecionar nenhum automaticamente.

#### 2. Adicionar desconto em R$ na mensalidade
- Novo estado `descontoManualReais` (default 0)
- Novo campo na seção "Plano e Desconto" ao lado do campo de percentual: "Desconto adicional (R$)"
- Cálculo: `mensalidadeFinal = valorAposPlano - descontoManualValor(%) - descontoManualReais`
- Quando o usuário preenche um, o outro se mantém (são acumulativos)

#### 3. Adicionar descontos na seção de Implantação
- Novos estados `descontoImplPercent` e `descontoImplReais` (default 0)
- Dois campos na seção de Implantação: "Desconto implantação (%)" e "Desconto implantação (R$)"
- Cálculo: `implantacaoFinal = implantacaoTotal - descontoImplPercVal - descontoImplReais`
- Atualizar `calc` para incluir `implantacaoFinal` e usar esse valor na proposta gerada

#### 4. Atualizar resumo lateral
- Passar novos campos de desconto para `PropostaResumoLateral` e exibir linhas de desconto da implantação

