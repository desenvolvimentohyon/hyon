
Objetivo: tirar o sistema da tela em branco e fazer uma verificação geral de compatibilidade para evitar novo loop de erro.

Diagnóstico
- Do I know what the issue is? Sim.
- O erro continua acontecendo antes mesmo do app renderizar as rotas, dentro de `QueryClientProvider` em `src/App.tsx`.
- A causa mais provável está confirmada no código: há divergência entre os arquivos de dependência.
- `package.json` está com `@tanstack/react-query: "5.62.0"` (compatível com React 18).
- `package-lock.json` está travado em `@tanstack/react-query: 5.83.0`, exatamente a faixa que já foi identificada no projeto como problemática com React 18.
- Ou seja: o projeto está declarando uma versão e instalando outra. Isso explica a tela branca persistente, mesmo após ajustes no `vite.config.ts`.

Plano de correção
1. Corrigir a fonte real do problema nas dependências
- Alinhar `package-lock.json` com `package.json`, garantindo `@tanstack/react-query@5.62.0`.
- Verificar se o lock usado pelo ambiente é `npm` ou `bun`; hoje há indício forte de que o ambiente está resolvendo pelo `package-lock.json`.
- Manter apenas uma versão efetiva do React Query no projeto.

2. Revisar consistência dos gerenciadores de pacote
- Verificar conflito entre `package-lock.json`, `bun.lock` e `bun.lockb`.
- Definir uma estratégia consistente:
  - ou manter só o lock realmente usado pelo projeto,
  - ou garantir que todos apontem para a mesma versão de dependências.
- Isso evita que o ambiente reinstale a versão quebrada depois.

3. Preservar as proteções já aplicadas no bundler
- Manter em `vite.config.ts`:
  - `resolve.dedupe` para `react` e `react-dom`
  - `optimizeDeps.include` para os pacotes centrais do React
- Esses ajustes continuam válidos como proteção contra múltiplas instâncias de React, mas não substituem o acerto do lockfile.

4. Fazer uma verificação geral do bootstrap do app
- Revisar `src/main.tsx` e `src/App.tsx` para garantir que:
  - há apenas um `createRoot`
  - providers estão montados em ordem segura
  - nenhum provider novo introduzido no redesign depende de contexto ausente
- Confirmar que o problema principal continua concentrado no provider de query, não em rota ou layout.

5. Fazer uma varredura rápida pós-correção
- Confirmar que a aplicação volta a renderizar ao menos a tela inicial/autenticação.
- Revisar os arquivos alterados no redesign visual que podem gerar erro secundário após o app voltar:
  - `src/components/layout/AppLayout.tsx`
  - `src/components/layout/AppSidebar.tsx`
  - `src/components/layout/Topbar.tsx`
  - `src/components/layout/ModuleNavGrid.tsx`
  - `src/pages/Clientes.tsx`
  - `src/pages/ClientesReceita.tsx`
  - `src/components/clientes/ClienteCard.tsx`

O que vou implementar
- Ajuste de dependências/lockfile para fixar `@tanstack/react-query` na versão compatível com React 18.
- Revisão de consistência entre lockfiles.
- Manutenção do hardening do Vite já existente.
- Checagem dos pontos críticos de renderização inicial para evitar que, ao corrigir o React Query, apareça um segundo erro escondido.

Arquivos envolvidos
- `package.json`
- `package-lock.json`
- possivelmente `bun.lock` / `bun.lockb`
- `vite.config.ts`
- revisão de leitura em `src/App.tsx` e `src/main.tsx`

Resultado esperado
- O app deixa de abrir em branco.
- `QueryClientProvider` volta a montar normalmente.
- O sistema passa a carregar a tela inicial, permitindo então validar o restante do layout e das páginas de clientes.
