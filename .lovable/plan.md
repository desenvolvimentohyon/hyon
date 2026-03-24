

## Plano: Redesign do PDF da proposta com tema escuro e layout atualizado

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/lib/pdfGenerator.ts` | Redesenhar a capa e o conteúdo do PDF com tema escuro, informações da empresa reorganizadas e prazo de validade |

### Detalhes

#### 1. Tema escuro com detalhes em verde claro
- Fundo do body/cover: tom escuro (`#0f172a` ou `#1a1a2e`)
- Textos informativos e labels em verde claro (`#4ade80` / `#86efac`)
- Títulos e valores em branco
- Cards e tabelas com fundo semi-transparente claro sobre o escuro

#### 2. Reorganizar capa (cover page)
- **Topo esquerdo**: Logo da empresa (imagem do storage)
- **Centro**: Nome da empresa "HYON TECNOLOGIA" em destaque
- **Abaixo do centro**: Cards com Cliente, Proposta, Data, **Validade** (já existe, mas garantir que o `validUntil` seja passado corretamente)
- **Rodapé da capa / esquerda inferior**: CNPJ, telefone, email, endereço completo

#### 3. Adicionar prazo de validade
- O campo `validUntil` já existe no `PdfProposalData` e já é exibido na capa como "Validade"
- Garantir que o valor é passado corretamente pelo `gerarPDFPropostaComDados`
- Adicionar uma linha nas "Condições Comerciais" com o prazo de validade

#### 4. Rodapé
- Substituir rodapé atual por: `© {ano} Hyon Tecnologia — Todos os direitos reservados`
- Manter CNPJ, telefone, email e endereço no rodapé também

#### 5. Cores e estilos CSS
- `@page` background: escuro
- `.cover`: fundo escuro, texto branco/verde
- `.section h2`: verde claro
- Tabelas: bordas em verde claro translúcido, texto branco
- Cards de resumo: fundo escuro com borda verde

