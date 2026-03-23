

## Plano: Jarvis — Assistente de Comando Total por Voz

### Resumo
Adicionar uma camada de interpretação de comandos ao Jarvis que mapeia texto/voz para ações do sistema (navegação, criação, consulta). Usa a edge function `ai-consultant` com novo modo `command` para interpretar intenção, e um novo hook client-side executa a ação correspondente via React Router e toasts de confirmação.

### Arquitetura: 1 novo arquivo + 3 edições

### 1. Edge Function: `ai-consultant/index.ts` (adicionar modo `command`)

Novo `type: "command"` que recebe o texto do comando + rota atual + permissões do usuário e retorna via tool calling:

```
Tool: jarvis_command
{
  intent: "navigate" | "create" | "query" | "action" | "unknown",
  route?: string,           // ex: "/clientes", "/financeiro"
  entity_type?: string,     // ex: "tarefa", "proposta", "cliente"
  entity_name?: string,     // ex: "João", "Mercado Central"
  params?: Record<string, string>,  // ex: { valor: "500", data: "amanhã" }
  requires_confirmation?: boolean,
  confirmation_message?: string,
  spoken_response: string,  // resposta falada/textual do Jarvis
  fallback_chat?: boolean   // se true, redireciona para chat normal
}
```

System prompt inclui a lista de rotas/módulos disponíveis do `sidebarModules.ts` e os comandos rápidos suportados.

### 2. Novo hook: `src/hooks/useJarvisCommands.ts`

Responsável por executar ações baseadas no resultado do `jarvis_command`:

- **navigate**: `useNavigate()` para a rota retornada
- **create**: navega para a rota + abre modal/formulário (ex: `/propostas` com query param `?new=1`)
- **query**: delega para o chat existente do `AiExecutiveAssistant`
- **action**: executa ações como criar tarefa via Supabase, com confirmação se `requires_confirmation`
- **unknown**: responde "Não entendi, pode repetir?"

Integra com permissões via `useAuth()` — bloqueia ações não permitidas.

Mantém histórico dos últimos 20 comandos em `useState`.

### 3. Editar: `src/components/ai/AiExecutiveAssistant.tsx`

- Importar `useJarvisCommands`
- No `handleChat` e `handleSpeechResult`: antes de enviar ao chat, verificar se o texto é um comando (invocar `ai-consultant` com `type: "command"`)
- Se a IA retornar `intent !== "unknown"` e `fallback_chat !== true`, executar o comando e mostrar `spoken_response` como mensagem do assistente + falar se voz ativada
- Se `fallback_chat === true`, seguir fluxo normal de chat
- Adicionar seção "Comandos rápidos" colapsável com chips clicáveis: "Abrir clientes", "Criar proposta", "Ver financeiro", "Clientes em risco", "Criar tarefa"
- Diálogo de confirmação inline para ações sensíveis (`requires_confirmation`)

### 4. Editar: `supabase/functions/ai-consultant/index.ts`

Adicionar bloco `if (type === "command")` com:
- System prompt contendo mapa de rotas (extraído de `sidebarModules`)
- Lista de ações suportadas (navigate, create tarefa/proposta/cliente, query)
- Tool `jarvis_command` com schema acima
- Instrução para respeitar permissões passadas no payload

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/ai-consultant/index.ts` | Adicionar modo `command` |
| `src/hooks/useJarvisCommands.ts` | **Novo** — execução de comandos |
| `src/components/ai/AiExecutiveAssistant.tsx` | Integrar comandos + chips rápidos |

### Notas técnicas
- Sem alteração de banco de dados
- Reutiliza edge function existente
- Comandos de navegação: mapa hardcoded de aliases → rotas (ex: "clientes" → "/clientes", "financeiro" → "/financeiro")
- Confirmação inline no chat (não modal separado) para ações sensíveis
- Histórico de comandos armazenado em memória (não persistido)
- Permissões checadas client-side via `useAuth().profile` antes de executar

