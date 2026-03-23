

## Plano: Adicionar Sparklines e Mini-Gráficos nos Cards do Cockpit

### Resumo
Inserir visualizações compactas (sparklines e mini-gráficos) dentro dos 4 cards principais do Cockpit: sparkline de MRR (últimos 6 meses), mini barras de evolução de clientes, mini funil comercial, e barras de tarefas por status.

### Abordagem
Usar Recharts (já instalado no projeto) com componentes compactos sem eixos, criando sparklines leves de ~40px de altura dentro dos cards existentes.

### 1. Criar: `src/hooks/useCockpitCharts.ts`
Hook que busca dados históricos para os gráficos:
- **MRR últimos 6 meses**: query em `financial_titles` agrupando receita por competência (últimos 6 meses)
- **Evolução de clientes**: query em `clients` agrupando `created_at` por mês (últimos 6 meses) + cancelados
- **Funil comercial**: query em `proposals` contando por status (draft, sent, accepted, refused)
- **Tarefas por status**: query em `tasks` contando por status (pendente, andamento, concluída)

Retorna dados formatados para Recharts.

### 2. Editar: `src/pages/Cockpit.tsx`
Adicionar mini-gráficos dentro de cada `CockpitCard`:

- **Card Financeiro**: Sparkline (LineChart sem eixos, 100% width, 40px height) mostrando evolução do MRR mensal. Linha verde com gradiente sutil.
- **Card Clientes**: BarChart mini com barras empilhadas: novos (verde) vs cancelados (vermelho) por mês.
- **Card Comercial**: Barras horizontais representando o funil: Abertas → Aceitas → Perdidas, com cores semânticas.
- **Card Tarefas**: BarChart mini com 3 barras: Pendentes (amber), Em andamento (blue), Concluídas (green).

Cada gráfico fica abaixo dos dados textuais já existentes, separado por um `<Separator />` fino.

### Componentes Recharts usados
```text
LineChart + Line + Area (sparkline MRR)
BarChart + Bar (clientes, tarefas)
Div + styled bars (funil comercial - CSS puro para simplicidade)
```

Todos sem `XAxis`, `YAxis`, `CartesianGrid` — apenas a visualização pura para manter a compacidade.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useCockpitCharts.ts` | Novo — busca dados históricos |
| `src/pages/Cockpit.tsx` | Adiciona sparklines nos 4 cards principais |

### Notas
- Recharts já está instalado e configurado no projeto
- Fallback: se não houver dados históricos, não mostra o gráfico (graceful degradation)
- Gráficos são puramente visuais (sem tooltips complexos) para manter performance

