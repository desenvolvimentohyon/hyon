

# Sistema Gerenciador de Tarefas

## Visão Geral
Aplicação completa de gerenciamento de tarefas, 100% front-end, com estado local persistido em localStorage e dados fake na primeira execução.

---

## Estrutura e Layout

- **Sidebar lateral** com navegação: Dashboard, Tarefas, Clientes, Técnicos, Configurações
- **Topbar** com busca global, botão "Nova Tarefa", seletor de técnico atual e indicador de tarefas atrasadas
- Layout responsivo (desktop + mobile com sidebar colapsável)

---

## Páginas

### 1. Dashboard
- Cards KPI: total de tarefas, em andamento, concluídas, atrasadas, vencendo hoje
- Lista "Minhas Tarefas" filtrada pelo técnico selecionado
- Botões rápidos: nova tarefa, novo cliente, novo técnico

### 2. Tarefas (Tabela + Kanban)
- Alternância entre visualização em tabela e kanban (drag simulated)
- Filtros: status, prioridade, técnico, cliente, avulsas, atrasadas
- Busca por título/descrição/tag, ordenação, paginação local
- Kanban com colunas por status e cards arrastáveis

### 3. Detalhe da Tarefa
- Header com título editável, status, prioridade, responsável, cliente, prazo
- 5 abas: Resumo, Checklist (com progresso %), Tempo (timer hh:mm:ss com regra de exclusividade), Comentários, Histórico (timeline)

### 4. Clientes
- Tabela com busca e cadastro (nome, telefone, email, documento, observações)
- Detalhe do cliente com lista de tarefas vinculadas

### 5. Técnicos
- Lista, criar/editar, ativar/desativar
- Seletor de técnico atual usado globalmente

### 6. Configurações
- Personalizar labels de status e prioridades
- Modo compacto, resetar dados, exportar/importar JSON

---

## Estado e Persistência
- Context API centralizado para tarefas, clientes, técnicos e configurações
- Persistência automática em localStorage
- Skeleton loading de 500ms simulado
- Toda alteração registrada no histórico da tarefa

---

## Dados Iniciais (Seed)
- 6 clientes, 4 técnicos, 18 tarefas com mix de status, prioridades, prazos vencidos, tarefas avulsas, checklists e comentários

---

## UX
- Interface moderna e minimalista usando shadcn/ui
- Toasts para ações (salvar, concluir, timer)
- Estados vazios ilustrados
- Badges visuais para "Atrasada" e "Vence hoje"

