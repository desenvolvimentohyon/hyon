

## Plano: Corrigir Botão "Atualizar" do Banner PWA

### Problema

No `PwaUpdateBanner`, o botão "Atualizar" chama `updateSW()` mas não executa `window.location.reload()`. Se o usuário clica no botão antes do timeout automático de 2s, o SW é atualizado mas a página não recarrega.

### Correção

**Arquivo: `src/main.tsx`** (linha 47)

Alterar o `onUpdate` para também fazer reload após chamar `updateSW`:

```typescript
// De:
onUpdate={() => { updateSW?.(); }}

// Para:
onUpdate={async () => {
  try { await updateSW?.(); } catch {}
  window.location.reload();
}}
```

### Arquivo Afetado
| Arquivo | Alteração |
|---|---|
| `src/main.tsx` | Adicionar `window.location.reload()` ao handler do botão manual |

