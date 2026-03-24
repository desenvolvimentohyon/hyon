

## Plano: Redesign da capa do PDF — layout compacto em página A4 única

### Problema
1. O nome "HYON TECNOLOGIA" está muito grande e centralizado; as informações da empresa ficam separadas
2. Os cards de metadados (cliente, proposta, datas) não estão padronizados
3. A capa ocupa uma página inteira (`page-break-after: always`) e o conteúdo vai para a segunda página

### Alterações

| Arquivo | Mudança |
|---------|------|
| `src/lib/pdfGenerator.ts` | Redesenhar a capa como cabeçalho compacto e remover a quebra de página, unificando tudo em uma única página A4 |

### Detalhes

1. **Cabeçalho compacto** (substituir a capa full-page):
   - **Esquerda**: Logo + nome da empresa (tamanho reduzido ~20px) como título
   - **Direita**: Informações da empresa (CNPJ, telefone, email, endereço) alinhadas à direita
   - Layout em `flex` com `justify-content: space-between`

2. **Metadados padronizados** (abaixo do cabeçalho):
   - Grid 4 colunas em uma única linha: Cliente | Proposta | Data | Validade
   - Todos com mesmo estilo, tamanho e espaçamento
   - Tamanho compacto (padding menor)

3. **Remover quebra de página da capa**:
   - Remover `page-break-after: always` do `.cover`
   - Remover `min-height: 100vh` 
   - A capa vira um cabeçalho que flui direto para o conteúdo

4. **Ajustes gerais de tamanho**:
   - Reduzir margens e paddings das seções
   - Fontes menores nos cards de resumo
   - Tudo deve caber em uma página A4 (ou o mínimo de páginas possível)

