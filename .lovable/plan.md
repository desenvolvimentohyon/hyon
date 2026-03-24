

## Plano: Mover informações da empresa para o topo da capa do PDF

### Alteração

| Arquivo | Mudança |
|---------|------|
| `src/lib/pdfGenerator.ts` | Reorganizar a capa: mover CNPJ, telefone, email e endereço do rodapé da capa para o topo, junto com a logo |

### Detalhes

Na seção `.cover` do HTML (linhas 210-230):
- **Topo**: Logo + informações da empresa (CNPJ, telefone, email, endereço) lado a lado ou logo acima e dados abaixo
- **Centro**: Mantém "HYON TECNOLOGIA" + "PROPOSTA COMERCIAL" + cards de metadados
- **Rodapé da capa**: Fica vazio ou com texto simples de direitos reservados

Basicamente, mover o conteúdo do `.cover-bottom` (linhas 225-229) para dentro do `.cover-top` (linhas 211-213), posicionando as informações logo abaixo da logo no topo esquerdo.

