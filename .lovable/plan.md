

## Plano: Corrigir contagem de tarefas pendentes nos cards e cockpit

### Problema
Os status das tarefas no banco de dados são: `backlog`, `a_fazer`, `em_andamento`, `aguardando_cliente`, `concluida`, `cancelada`.

Porém, as queries que contam tarefas pendentes usam `status = "pendente"` — um valor que **não existe** na tabela. Por isso o contador sempre retorna 0.

O mesmo problema ocorre em:
- `useSmartCardStats.ts` (card de Tarefas na sidebar/dashboard)
- `useExecutiveBriefing.ts` (cockpit e IA executiva)
- `useCockpitCharts.ts` (gráficos do cockpit)

### Correções

| Arquivo | Mudança |
|---------|------|
| `src/hooks/useSmartCardStats.ts` | Trocar `.eq("status", "pendente")` por `.in("status", ["backlog", "a_fazer"])` |
| `src/hooks/useExecutiveBriefing.ts` | Trocar `.in("status", ["pendente", "em_andamento"])` por `.in("status", ["backlog", "a_fazer", "em_andamento"])` e `.eq("priority", "urgente")` com os status corretos |
| `src/hooks/useCockpitCharts.ts` | Trocar mapeamento de `"pendente"/"aberta"` por `"backlog"/"a_fazer"`, e `"andamento"` por `"em_andamento"`, e `"concluída"/"feita"` por `"concluida"` |

### Resultado
Os cards e gráficos passarão a contar corretamente as tarefas com status `backlog` e `a_fazer` como "pendentes", `em_andamento` como "em andamento", e `concluida` como "concluídas".

