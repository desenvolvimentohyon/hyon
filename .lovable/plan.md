

## Plano: Integrar Voz ao Jarvis

### Resumo
Adicionar interação por voz ao assistente executivo existente usando as APIs nativas do navegador (Web Speech API): `SpeechSynthesis` para fala e `SpeechRecognition` para escuta. Sem dependências externas, sem API keys adicionais, sem custos. Fallback elegante quando o navegador não suportar.

### Arquitetura: 2 novos arquivos + 2 edições

### 1. Novo hook: `src/hooks/useJarvisVoice.ts`

Hook centralizado que gerencia toda a camada de voz:

**Text-to-Speech (fala)**
- Usa `window.speechSynthesis` com preferência por voz pt-BR (Google, Luciana, etc.)
- Métodos: `speak(text)`, `stop()`, `pause()`, `resume()`
- Estado: `isSpeaking`, `voiceEnabled`, `volume`, `rate`
- Seleciona automaticamente a melhor voz disponível em português
- Controle de volume e velocidade

**Speech-to-Text (escuta)**
- Usa `webkitSpeechRecognition` / `SpeechRecognition`
- Métodos: `startListening()`, `stopListening()`
- Estado: `isListening`, `transcript`, `micSupported`
- Callback `onResult(text)` para enviar ao chat do Jarvis
- Pede permissão de microfone apenas ao clicar

**Configurações persistidas** em `localStorage`:
- `jarvis_voice_enabled` (boolean)
- `jarvis_auto_welcome` (boolean)
- `jarvis_auto_read_briefing` (boolean)
- `jarvis_voice_responses` (boolean)
- `jarvis_volume` (0-1)
- `jarvis_rate` (0.7-1.3)

### 2. Novo componente: `src/components/ai/JarvisVoiceControls.tsx`

Barra compacta de controles de voz inserida no header do card do assistente:

- Botão 🎤 "Falar com Jarvis" (ativa microfone, mostra waveform animado enquanto ouve)
- Botão 🔊 "Ouvir resumo" (lê o briefing em voz alta)
- Botão ⏸ Pausar / ▶ Retomar
- Botão 🔇 Mute (desativa voz)
- Indicador visual de estado: "Ouvindo..." / "Falando..." com animação CSS (pulso/glow)
- Quando `isListening`: mostra dots animados + texto reconhecido em tempo real
- Quando `isSpeaking`: glow sutil no ícone do Brain

### 3. Editar: `src/components/ai/AiExecutiveAssistant.tsx`

- Importar `useJarvisVoice` e `JarvisVoiceControls`
- Inserir `<JarvisVoiceControls />` no header do card, ao lado dos botões existentes
- **Boas-vindas por voz**: Após o briefing carregar pela primeira vez na sessão, se `auto_welcome` estiver ativo, chamar `speak(briefing.saudacao + ". " + briefing.resumoDia)` — usa `sessionStorage` para garantir que fala apenas uma vez por sessão
- **Microfone → Chat**: Quando o reconhecimento de voz finalizar, inserir o texto no campo de chat e disparar `handleChat()` automaticamente
- **Respostas por voz**: Após receber resposta do chat, se `voice_responses` estiver ativo, chamar `speak(response)`
- Botão "Ouvir resumo" chama `speak(briefing.resumoDia)`

### 4. Editar: `src/pages/Dashboard.tsx`

Nenhuma mudança necessária — o componente `AiExecutiveAssistant` já está integrado. As mudanças ficam internas ao componente.

### Detalhes técnicos

**Seleção de voz pt-BR:**
```text
1. Buscar vozes com lang.startsWith("pt")
2. Preferir vozes com "Google" ou "Luciana" no nome
3. Fallback para qualquer voz pt-BR disponível
4. Se nenhuma pt-BR, usar voz padrão do sistema
```

**Fallbacks:**
- Sem `speechSynthesis` → botões de voz não aparecem, tudo funciona em texto
- Sem `SpeechRecognition` → botão de microfone não aparece
- Autoplay bloqueado → mostrar botão "Ativar voz do Jarvis" discreto
- Microfone negado → toast amigável "Permita acesso ao microfone para falar com o Jarvis"

**Animações CSS:**
- `@keyframes pulse-voice` para indicador de fala
- `@keyframes wave-dots` para indicador de escuta
- Glow no ícone Brain quando Jarvis está falando

**Segurança:**
- Microfone só ativa com clique explícito do usuário
- Voz não trava a interface (usa API assíncrona)
- `speechSynthesis.cancel()` antes de cada nova fala

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useJarvisVoice.ts` | **Novo** — hook com TTS + STT + config |
| `src/components/ai/JarvisVoiceControls.tsx` | **Novo** — controles visuais de voz |
| `src/components/ai/AiExecutiveAssistant.tsx` | Integrar voz (boas-vindas, chat, resumo) |
| `src/index.css` | Adicionar keyframes de animação para voz |

### Notas
- Sem dependências externas ou API keys — usa 100% APIs do navegador
- Sem alteração de banco de dados
- Sem alteração na edge function
- Funciona em Chrome, Edge, Safari (desktop). Firefox tem suporte parcial ao SpeechRecognition
- Configurações salvas em localStorage (sem necessidade de nova tabela)

