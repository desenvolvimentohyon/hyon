
Diagnóstico:
- O dropdown já foi implementado em `src/pages/Parametros.tsx`, mas essa tela não é a que o usuário vê.
- A rota `/parametros` redireciona para `/configuracoes` em `src/App.tsx`.
- A tela ativa (`src/pages/Configuracoes.tsx`) ainda mostra apenas o botão `Novo Módulo`, exatamente como aparece no print.
- Portanto, o problema não é de dados nem de backend; é de interface na página errada.

Plano de correção:
1. Atualizar `src/pages/Configuracoes.tsx` para incluir o mesmo filtro já existente em `Parametros.tsx`.
   - Adicionar `useMemo` e o ícone `Filter` nos imports.
   - Criar o estado `filtroSistemaModulo`.
   - Criar `modulosFiltrados` com 3 opções:
     - `todos`
     - `global`
     - `sistemaId` específico

2. Ajustar o cabeçalho da subaba `Configurações Gerais → Módulos`.
   - Trocar o container atual que só tem `Novo Módulo`
   - Inserir um layout com:
     - dropdown “Filtrar por sistema” à esquerda
     - botão `Novo Módulo` à direita
   - Manter `flex-wrap` para funcionar bem no viewport atual (~811px)

3. Atualizar a tabela de módulos em `Configuracoes.tsx`.
   - Renderizar `modulosFiltrados` no lugar de `modulos`
   - Adicionar estado vazio coerente quando o filtro não retornar resultados

4. Garantir consistência entre as duas telas.
   - Como `Parametros.tsx` está redundante hoje, usar `Configuracoes.tsx` como fonte principal da interface
   - Manter a mesma experiência visual/padrão para evitar regressão futura

Validação esperada:
- Ao abrir `Configurações → Configurações Gerais → Módulos`, o dropdown deve aparecer ao lado do botão `Novo Módulo`
- Ao selecionar um sistema, a tabela deve mostrar apenas os módulos vinculados a ele
- Ao selecionar `Módulos Globais`, a tabela deve mostrar apenas os globais
- Em telas menores, filtro e botão devem quebrar linha sem sumir

Detalhes técnicos:
- Arquivo principal a corrigir: `src/pages/Configuracoes.tsx`
- Referência pronta para copiar/adaptar: `src/pages/Parametros.tsx`
- Nenhuma alteração de banco, autenticação ou contexto é necessária
