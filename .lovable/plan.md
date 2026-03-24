

## Plano: Corrigir visibilidade das Sugestões Inteligentes e separar valores no rodapé/resumo

### Problemas
1. **Sugestões Inteligentes**: O componente está no final da coluna esquerda, mas com o rodapé fixo mobile (`fixed bottom-0`) cobrindo o conteúdo inferior, fica escondido. Precisa de padding-bottom extra na coluna principal.
2. **Valor total no rodapé mobile**: Mostra `mensalidade + implantação` somados em um único valor. Precisa exibir separadamente.
3. **Resumo lateral (desktop)**: O bloco "Valor Total" também soma tudo — precisa separar mensalidade e implantação visualmente.

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/pages/PropostaInteligente.tsx` | Adicionar `pb-24` no container principal para evitar que o rodapé fixo cubra conteúdo; separar valores no rodapé mobile |
| `src/components/propostas/PropostaResumoLateral.tsx` | Separar mensalidade e implantação no bloco "Valor Total" do resumo lateral |

#### 1. Visibilidade das Sugestões (PropostaInteligente.tsx)
- Adicionar `pb-24` ao container principal (ou à coluna esquerda) para que o conteúdo não fique escondido atrás do rodapé fixo mobile

#### 2. Rodapé mobile (PropostaInteligente.tsx, linhas 578-591)
Substituir o valor total único por dois valores lado a lado:
- **Mensalidade**: `R$ X/mês`
- **Implantação**: `R$ Y`

#### 3. Resumo lateral (PropostaResumoLateral.tsx, linhas 219-226)
Substituir o bloco único "Valor Total" por duas linhas separadas:
- **Mensalidade final**: `R$ X/mês`
- **Implantação total**: `R$ Y`
- Remover o valor somado

