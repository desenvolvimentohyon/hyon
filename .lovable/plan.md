

# Módulo "Propostas + CRM" — Plano de Implementação

## Resumo
Novo módulo completo de Propostas com gestão em tabela, pipeline CRM em Kanban, editor de proposta, geração de PDF fake, link de aceite simulado, e configurações parametrizáveis. Tudo local com localStorage.

---

## Modelo de Dados

### Nova entidade: `Proposta`
Campos: `id`, `numeroProposta` (PROP-2026-XXXX), `clienteId`, `clienteNomeSnapshot`, `sistema` (HYON/LINKPRO/OUTRO), `planoNome`, `valorMensalidade`, `valorImplantacao`, `fluxoPagamentoImplantacao`, `parcelasImplantacao`, `dataEnvio`, `validadeDias`, `dataValidade`, `statusCRM`, `statusVisualizacao`, `statusAceite`, `linkAceite`, `pdfGeradoEm`, `observacoesInternas`, `informacoesAdicionais`, `itens[]`, `historico[]`, `criadoEm`, `atualizadoEm`.

### Nova entidade: `CRMConfig`
Campos: `statusKanban[]`, `validadePadraoDias`, `formaEnvioPadrao`, `mensagemPadraoEnvio`, `nomeEmpresa`, `informacoesAdicionaisPadrao`, `rodapePDF`, `corTemaPDF`, `exibirAssinaturaDigitalFake`.

### Alteração em `Configuracoes`
Adicionar campo `crmConfig: CRMConfig` ao tipo existente.

---

## Novas Rotas e Navegação

| Rota | Página | Descrição |
|------|--------|-----------|
| `/propostas` | Propostas.tsx | Tabela com filtros, busca, ações por linha |
| `/propostas/:id` | PropostaDetalhe.tsx | Editor/detalhe da proposta |
| `/crm` | CRM.tsx | Kanban de propostas por statusCRM |
| `/aceite/:numero` | AceiteProposta.tsx | Tela pública fake de aceite/recusa |

Sidebar: adicionar "Propostas" e "CRM" na seção "Módulos".

---

## Arquivos a Criar

1. **`src/types/propostas.ts`** — Tipos `Proposta`, `CRMConfig`, `PropostaItem`, `PropostaHistorico`
2. **`src/contexts/PropostasContext.tsx`** — Context separado para propostas e CRM config, com CRUD, persistência localStorage, geração de número sequencial, cálculo de validade, registro de histórico
3. **`src/data/seedPropostas.ts`** — 10 propostas seed + config CRM default
4. **`src/pages/Propostas.tsx`** — Tabela com filtros, busca, menu de ações (3 pontos) por linha
5. **`src/pages/PropostaDetalhe.tsx`** — Editor com seções (cliente, sistema, valores, conteúdo, status) + barra de ações fixa + timeline de histórico
6. **`src/pages/CRM.tsx`** — Kanban com drag-and-drop, colunas parametrizadas pelo CRM config
7. **`src/pages/AceiteProposta.tsx`** — Tela simples pública fake com resumo + botões Aceitar/Recusar
8. **`src/lib/pdfGenerator.ts`** — Geração de PDF fake usando canvas/blob para download

## Arquivos a Modificar

1. **`src/App.tsx`** — Novas rotas + PropostasProvider wrapper
2. **`src/components/layout/AppSidebar.tsx`** — Adicionar "Propostas" e "CRM" na seção Módulos
3. **`src/pages/Configuracoes.tsx`** — Nova seção "Propostas" com CRUD de status CRM, templates de mensagem, branding, validade padrão
4. **`src/pages/Dashboard.tsx`** — KPIs de propostas (enviadas 7d, aceitas 30d, expiradas) + lista de propostas vencendo

---

## Funcionalidades Detalhadas

### Tabela de Propostas (`/propostas`)
- Filtros: statusCRM, visualização, aceite, sistema, data envio
- Colunas: número, cliente, sistema, mensalidade, implantação, fluxo, envio, visualização, aceite, status CRM
- Menu de ações: abrir, clonar, baixar PDF, gerar link, marcar enviada/visualizada/não abriu/aceitou/recusou, excluir
- Badge "Expirada" quando `dataValidade < now` e `statusAceite !== "aceitou"`

### Editor de Proposta (`/propostas/:id`)
- Seções: dados cliente (dropdown com busca ou nome manual), sistema/plano, valores (mensalidade + implantação + fluxo), conteúdo (textarea + itens opcionais), status
- Barra de ações fixa: Salvar, Enviar (modal com template de mensagem), Baixar PDF, Copiar link, Clonar
- Timeline de histórico na lateral/abaixo

### CRM Kanban (`/crm`)
- Colunas dinâmicas baseadas em `crmConfig.statusKanban`
- Cards com: cliente, sistema, mensalidade, implantação, badges de visualização/aceite/expirada
- Drag-and-drop atualiza statusCRM e registra no histórico

### PDF Fake
- Gerar blob HTML formatado como PDF usando `window.print()` ou canvas-to-blob
- Layout: logo + empresa, dados cliente, sistema/plano, valores, texto adicional, rodapé, validade
- Download como arquivo .html estilizado (sem dependência externa)

### Tela de Aceite (`/aceite/:numero`)
- Rota pública (sem layout sidebar)
- Resumo da proposta + botões Aceitar/Recusar
- Atualiza `statusAceite` e `statusCRM` no estado local

### Configurações de Propostas
- CRUD de status CRM (criar, editar, remover, reordenar)
- Template de mensagem com variáveis: `{cliente}`, `{numeroProposta}`, `{sistema}`, etc.
- Validade padrão em dias
- Nome empresa, rodapé PDF, informações adicionais padrão
- Botões: salvar, restaurar padrão

### Dashboard — Novos Widgets
- KPI: propostas enviadas (7d), aceitas (30d), expiradas
- Lista: propostas vencendo hoje/amanhã
- Resumo por statusCRM (contagem por coluna)

---

## Seed de Dados
10 propostas: 3 enviadas, 2 visualizadas, 1 não abriu, 2 aceitas, 1 recusada, 2 expiradas, 1 rascunho. Config CRM com status padrão: Rascunho, Enviada, Visualizada, Negociação, Aceita, Recusada.

---

## Detalhes Técnicos

- Context separado (`PropostasContext`) para não sobrecarregar o `AppContext` existente
- Persistência em chave localStorage separada: `propostas-data`
- Numeração sequencial: buscar maior número existente e incrementar
- Skeleton loading 500ms consistente com o resto do app
- Toasts para todas as ações: salvar, enviar, copiar link, baixar PDF, aceitar, recusar

