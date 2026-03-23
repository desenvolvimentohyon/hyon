

## Plano: Avatar Animado Futurista para o Jarvis

### Resumo
Criar um componente `JarvisAvatar` com animações CSS puras (sem canvas/WebGL) que reage aos estados do Jarvis (idle, falando, ouvindo, processando). Integrar como FAB flutuante no layout principal, abrindo o painel do assistente ao clicar.

### Arquitetura: 2 novos arquivos + 3 edições

### 1. Novo componente: `src/components/ai/JarvisAvatar.tsx`

Avatar visual baseado em esferas concêntricas animadas com CSS:

**Estrutura visual:**
- Núcleo central: círculo com gradiente azul-roxo-ciano
- Anel orbital: borda animada girando ao redor do núcleo
- Halo externo: glow difuso pulsante
- Ondas de áudio: rings expansivos (visíveis ao falar)

**Estados:**
- `idle`: pulse leve (respiração), rotação orbital lenta
- `speaking`: pulse intenso, ondas de áudio expandindo, glow aumentado
- `listening`: waveform dots animados ao redor, efeito captação
- `processing`: rotação orbital rápida, brilho intermitente

**Props:** `state: "idle" | "speaking" | "listening" | "processing"`, `size: "sm" | "md" | "lg"`, `onClick`, `compact: boolean`

### 2. Novo componente: `src/components/ai/JarvisFloatingButton.tsx`

FAB flutuante posicionado `fixed bottom-6 right-6 z-50`:

- Renderiza `<JarvisAvatar size="md" />` como botão
- Ao clicar: abre/fecha painel lateral (sheet/drawer) com o `AiExecutiveAssistant` completo
- Badge de notificação se houver alertas de alta prioridade
- Estado do avatar sincronizado com `useJarvisVoice` (fala/escuta)
- `prefers-reduced-motion`: desativa animações complexas
- Hover: scale sutil (1.08)

### 3. Editar: `src/components/ai/AiExecutiveAssistant.tsx`

- Substituir o ícone `Brain` no header por `<JarvisAvatar size="sm" state={currentState} />` onde `currentState` é derivado de `voice.isSpeaking`, `voice.isListening`, `isLoading`
- Remover classes `jarvis-speaking-glow` do Card (avatar absorve essa responsabilidade visual)

### 4. Editar: `src/components/layout/AppLayout.tsx`

- Importar e renderizar `<JarvisFloatingButton />` dentro do layout, abaixo do conteúdo principal
- O FAB aparece em todas as páginas autenticadas

### 5. Editar: `src/index.css`

Adicionar keyframes para o avatar:
- `jarvis-orbit`: rotação 360° do anel orbital (12s linear infinite)
- `jarvis-breathe`: scale 1→1.05→1 (3s ease-in-out infinite)
- `jarvis-ripple`: ondas expandindo de 100%→200% com fade (1.5s)
- `jarvis-core-pulse`: brilho do núcleo sincronizado com fala (0.6s)
- `jarvis-capture`: efeito de captação inverso para escuta

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/ai/JarvisAvatar.tsx` | **Novo** — componente visual do avatar |
| `src/components/ai/JarvisFloatingButton.tsx` | **Novo** — FAB flutuante com sheet |
| `src/components/ai/AiExecutiveAssistant.tsx` | Substituir Brain por JarvisAvatar no header |
| `src/components/layout/AppLayout.tsx` | Renderizar JarvisFloatingButton |
| `src/index.css` | Keyframes do avatar |

### Notas técnicas
- 100% CSS animations (sem canvas/WebGL) para performance
- Respeita `prefers-reduced-motion` para acessibilidade
- Avatar `sm` (28px) no header, `md` (56px) no FAB
- Paleta: `--primary` (azul), `--purple`, ciano via hsl(190 80% 50%)
- Glassmorphism: `backdrop-blur-sm` + `bg-card/30` + `border border-white/10`
- FAB usa Sheet do shadcn para painel lateral no desktop

