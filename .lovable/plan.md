

## Plano: Remover dupla contagem do valor do sistema na mensalidade

### Problema
O cálculo atual soma `sistema.valorVenda` (R$ 600) **mais** o valor dos módulos selecionados. Porém, conforme a regra de negócio do sistema, o preço do sistema já é representado pela soma dos seus módulos — não existe um valor avulso do sistema. Isso causa dupla contagem: R$ 600 do sistema + R$ 68,60 dos módulos = R$ 668,60, quando deveria ser apenas R$ 68,60 (dos módulos).

### Correção

| Arquivo | Mudança |
|---------|------|
| `src/pages/PropostaInteligente.tsx` | Remover `sistemaValor` do cálculo de `mensalidadeBase` — a mensalidade passa a ser apenas a soma dos módulos selecionados |

### Detalhes

1. **Linha 125**: Alterar `mensalidadeBase = sistemaValor + modulosValor` para `mensalidadeBase = modulosValor`
2. **Resumo lateral e itens da proposta**: Remover a linha de "Sistema" dos itens gerados (que adiciona o valor do sistema separadamente), manter apenas os módulos
3. O campo `sistemaValor` continua existindo para referência (nome do sistema no resumo), mas com valor 0 ou removido do cálculo financeiro

