

## Plano: IA Consultora Comercial

### Abordagem

Criar uma **edge function** que usa Lovable AI (Gemini Flash) para gerar análises comerciais contextuais, e um **componente de painel** que se integra na página de Proposta Inteligente existente. A IA recebe os dados da proposta (valores, margens, plano, módulos, distância, comissão) e retorna recomendações estruturadas via tool calling.

Além disso, criar um **score comercial client-side** (0-100) baseado em regras determinísticas — margem, desconto, plano, comissão — para feedback instantâneo sem depender de chamada de API.

### Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/ai-consultant/index.ts` | **Criar** — edge function que chama Lovable AI com dados da proposta e retorna análise estruturada |
| `src/components/propostas/ConsultoraComercialIA.tsx` | **Criar** — painel lateral/card com score, alertas, recomendações da IA e sugestões de upsell/retenção |
| `src/pages/PropostaInteligente.tsx` | **Editar** — integrar o painel ConsultoraComercialIA no layout (sidebar direita, abaixo do resumo) |
| `supabase/config.toml` | **Editar** — registrar a nova function |

### Edge Function (`ai-consultant`)

Recebe payload com dados da proposta, monta prompt de sistema instruindo a IA a agir como consultora comercial, e usa **tool calling** para retornar output estruturado:

```typescript
// Tool schema retornado:
{
  score_fechamento: number,        // 0-100
  classificacao: "baixa" | "media" | "alta",
  recomendacao_principal: string,
  alertas: [{ tipo: "risco" | "atencao" | "oportunidade", mensagem: string }],
  sugestao_plano: string | null,
  sugestao_desconto: string | null,
  sugestao_modulos: string | null,
  sugestao_implantacao: string | null,
  sugestao_upsell: string[],
  sugestao_retencao: string[],
  margem_avaliacao: "baixa" | "ideal" | "alta",
  cenario_recomendado: string | null
}
```

Modelo: `google/gemini-3-flash-preview` (rápido, bom raciocínio).

### Score Comercial (client-side, instantâneo)

Calculado em tempo real sem chamada de API, baseado em regras:
- **Margem** (peso 40%): `(mensalidade - custo) / mensalidade` → quanto maior, melhor score
- **Plano** (peso 20%): plano anual = 100, trimestral = 70, mensal = 40
- **Desconto** (peso 15%): até 10% = 100, 10-20% = 70, >20% = 40
- **Comissão** (peso 15%): comissão < 15% do total = 100, 15-25% = 60, >25% = 30
- **Módulos** (peso 10%): mais módulos = maior valor percebido = melhor score

Resultado visual: gauge circular com cor (verde/amarelo/vermelho) + classificação textual.

### Componente ConsultoraComercialIA

Painel com:
1. **Score de Fechamento** — gauge circular com número 0-100 (client-side, tempo real)
2. **Classificação** — badge colorida (Alta/Média/Baixa chance)
3. **Alertas** — lista com ícones coloridos (vermelho risco, laranja atenção, azul oportunidade)
4. **Recomendação principal** — texto da IA
5. **Sugestões** — cards compactos para plano, desconto, módulos, implantação
6. **Upsell** — lista de oportunidades de aumento de ticket
7. **Retenção** — sugestões se score baixo
8. **Botão "Consultar IA"** — dispara a edge function (não automático, para controlar uso)

Cores: verde (oportunidade), laranja (atenção), vermelho (risco), azul (recomendação) — conforme solicitado.

### Layout na PropostaInteligente

O painel da IA será posicionado na **sidebar direita**, abaixo do `PropostaResumoLateral` existente. No mobile, aparece como card inline após o formulário. O score client-side atualiza em tempo real; a análise da IA é disparada por botão.

### O que NÃO será alterado
- Banco de dados (zero migrações)
- Lógica existente de CRM/financeiro
- Fluxo de criação de proposta
- Geração de PDF / WhatsApp

### Integração com dashboard e configurações
Serão fases futuras — esta entrega foca no painel da IA dentro da proposta inteligente, que é o ponto de maior impacto.

