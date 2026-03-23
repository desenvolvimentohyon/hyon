

## Plano: Modo Cockpit — Central de Comando Inteligente

### Resumo
Criar uma nova página `/cockpit` que funciona como central de comando unificada, integrando dados e IAs já existentes em um layout otimizado de "mission control". Reutiliza hooks e componentes existentes sem duplicar lógica.

### Arquitetura: 1 novo arquivo + 2 edições

### 1. Nova página: `src/pages/Cockpit.tsx`

Página completa com layout de cockpit dividido em seções:

**Topo — Saudação + Status**
- Reutiliza `useExecutiveBriefing()` para saudação e métricas
- KPIs compactos inline: MRR, Clientes Ativos, Inadimplentes, Propostas Abertas, Tarefas Pendentes, Churn
- Badge de status geral do negócio (verde/amarelo/vermelho)

**Grid Central — Cards Inteligentes (3 colunas no desktop)**

| Card | Dados | Fonte |
|------|-------|-------|
| Financeiro | MRR, receita mês, inadimplência, margem | `useExecutiveBriefing` + query direta `financial_titles` |
| Comercial | Propostas abertas/aceitas/taxa conversão, funil | `usePropostas` context |
| Clientes | Ativos, em risco, novos, health score médio | `useApp` context + queries |
| Tarefas do Dia | Pendentes, urgentes, sugeridas pela IA | Query `tasks` |
| Radar de Crescimento | Top 3 oportunidades, potencial upsell | `useGrowthRadar` (resumo compacto) |
| Radar de Risco | Top 3 clientes em risco, churn score | `useChurnAnalysis` |

**Seção Alertas + Ações**
- Lista de alertas priorizados (do briefing)
- Ações recomendadas com botões: Executar / Abrir / Ignorar
- Cada ação usa `useJarvisCommands` para executar

**Painel Lateral — Jarvis**
- `JarvisAvatar` com estado sincronizado
- `JarvisVoiceControls` para voz
- Campo de chat inline (reutiliza lógica de `AiExecutiveAssistant`)
- Chips de comandos rápidos

**Modo Foco**
- Toggle no header que esconde cards secundários
- Mostra apenas: Tarefas do dia + Alertas críticos + KPIs essenciais
- Persiste em `localStorage`

### 2. Editar: `src/App.tsx`
- Adicionar rota `/cockpit` com import do `Cockpit`

### 3. Editar: `src/lib/sidebarModules.ts`
- Adicionar "Modo Cockpit" como primeiro submódulo do grupo Dashboard com ícone `Gauge` (lucide)

### Detalhes técnicos

**Performance:**
- Reutiliza hooks existentes (`useExecutiveBriefing`, `useGrowthRadar`, `useChurnAnalysis`) — sem queries duplicadas
- Lazy load dos cards com `Suspense`
- `staleTime` dos hooks já configurado (5 min)

**Voz:**
- Reutiliza `useJarvisVoice` existente
- Boas-vindas automáticas ao entrar no cockpit (mesma lógica do dashboard, com flag `sessionStorage` separada: `jarvis_cockpit_welcome`)

**Responsividade:**
- Desktop: grid 3 colunas + sidebar Jarvis
- Tablet: grid 2 colunas, Jarvis colapsável
- Mobile: stack vertical, Jarvis via FAB existente

**Visual:**
- Glassmorphism nos cards (`bg-card/80 backdrop-blur-sm border-white/5`)
- Cores semânticas: verde (crescimento), vermelho (risco), azul (info), laranja (atenção)
- Glow sutil nos KPIs principais

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Cockpit.tsx` | **Novo** — página completa do cockpit |
| `src/App.tsx` | Nova rota `/cockpit` |
| `src/lib/sidebarModules.ts` | Novo submódulo "Modo Cockpit" |

### Notas
- Sem alteração de banco de dados
- Sem nova edge function — reutiliza `ai-consultant` existente
- Dashboard atual permanece intacto
- Todos os componentes de IA existentes são reutilizados, não duplicados

