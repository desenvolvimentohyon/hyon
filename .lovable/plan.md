

## Plano: Corrigir input de distância e separar forma de pagamento por seção

### Problemas
1. **Campo "Distância (km)"**: O zero inicial não apaga ao digitar — usa `value={distanciaKm}` com fallback `|| 0`, impedindo limpar o campo
2. **Forma de pagamento**: Existe um único seletor no final da página, mas deveria haver um para mensalidade e outro para implantação

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/pages/PropostaInteligente.tsx` | Corrigir inputs numéricos e separar forma de pagamento |

#### 1. Corrigir inputs numéricos (distância e dias)
- Usar `value={distanciaKm || ""}` para permitir apagar o zero
- Mesmo tratamento para o campo de dias: `value={dias || ""}` com fallback para 0
- Padrão: campo vazio = 0 no estado, mas exibe vazio no input

#### 2. Separar forma de pagamento em duas
- Adicionar estado `formaPagamentoImplId` para forma de pagamento da implantação
- Mover o seletor atual de forma de pagamento para dentro da seção "Plano e Desconto" (mensalidade)
- Adicionar novo seletor na seção "Implantação" para forma de pagamento da implantação
- Remover a card separada "Forma de Pagamento" do final da página
- Atualizar o resumo lateral para exibir ambas as formas de pagamento

#### 3. Atualizar resumo lateral
- `PropostaResumoLateral`: adicionar `formaPagamentoImpl` ao `ResumoData` e exibir separadamente

