

## Plano: Remover toda IA integrada ao sistema (incluindo Jarvis)

### Resumo
Remover todos os componentes, hooks, páginas e edge functions relacionados à IA do sistema — assistente Jarvis, consultora comercial, assistente financeiro, assistente de retenção, assistente de tarefas, cockpit IA e radar de crescimento.

### Arquivos a deletar (componentes e hooks de IA)
- `src/components/ai/JarvisFloatingButton.tsx`
- `src/components/ai/JarvisAvatar.tsx`
- `src/components/ai/JarvisVoiceControls.tsx`
- `src/components/ai/AiExecutiveAssistant.tsx`
- `src/components/ai/AiFinanceiroAssistant.tsx`
- `src/components/ai/AiRetencaoAssistant.tsx`
- `src/components/tarefas/AiTaskAssistant.tsx`
- `src/components/propostas/ConsultoraComercialIA.tsx`
- `src/components/propostas/PropostaComparador.tsx`
- `src/components/propostas/PropostaSugestoes.tsx`
- `src/hooks/useJarvisVoice.ts`
- `src/hooks/useJarvisCommands.ts`
- `src/hooks/useExecutiveBriefing.ts`
- `src/hooks/useFinancialDiagnosis.ts`
- `src/hooks/useChurnAnalysis.ts`
- `src/hooks/useGrowthRadar.ts`

### Edge functions a deletar
- `supabase/functions/ai-consultant/index.ts`
- `supabase/functions/ai-task-assistant/index.ts`

### Arquivos a editar (remover imports e uso dos componentes IA)

1. **`src/components/layout/AppLayout.tsx`** — Remover import e uso de `JarvisFloatingButton`
2. **`src/pages/Dashboard.tsx`** — Remover imports e uso de `AiExecutiveAssistant`, `AiFinanceiroAssistant`, `AiRetencaoAssistant`
3. **`src/pages/Clientes.tsx`** — Remover import e uso de `AiRetencaoAssistant`
4. **`src/pages/Tarefas.tsx`** — Remover import e uso de `AiTaskAssistant`
5. **`src/pages/financeiro/FinanceiroVisaoGeral.tsx`** — Remover import e uso de `AiFinanceiroAssistant`
6. **`src/pages/PropostaInteligente.tsx`** — Remover import e uso de `ConsultoraComercialIA`, `PropostaComparador`, `PropostaSugestoes`
7. **`src/pages/Cockpit.tsx`** — Remover todos os imports e usos de hooks/componentes IA (briefing, voice, commands, growth, churn, JarvisAvatar, JarvisVoiceControls). A página precisará ser simplificada ou removida.
8. **`src/pages/RadarCrescimento.tsx`** — Remover uso de `useGrowthRadar` e toda lógica IA. A página precisará ser simplificada ou removida.
9. **`supabase/config.toml`** — Remover entradas `[functions.ai-consultant]` e `[functions.ai-task-assistant]`

### Páginas que dependem fortemente de IA
- **Cockpit** (`/cockpit`) e **Radar de Crescimento** (`/radar-crescimento`) são quase inteiramente baseados em IA. Serão esvaziados para exibir apenas uma mensagem informativa ou removidos do roteamento.

### O que NÃO será removido
- `DashboardExecutiveWidgets` (widgets de KPI que não dependem de IA)
- `useCockpitCharts` (gráficos baseados em dados reais, não em IA)
- `PropostaResumoLateral` (resumo lateral que não usa IA)
- Edge functions não relacionadas a IA (billing-cron, cnpj-lookup, etc.)

