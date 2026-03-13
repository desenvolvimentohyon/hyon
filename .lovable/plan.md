

## Plano: Módulo de Automação Inteligente de Propostas

### Análise do Estado Atual

O sistema já possui:
- Propostas com CRM, parceiros, comissões (implantação + recorrente)
- Catálogo de sistemas, módulos, planos com descontos
- Parametrização de implantação (custo/km, diária, regiões)
- PDF, WhatsApp, link público

O que **falta**: preenchimento automático de valores com base nos catálogos, simulador em tempo real, comparador de cenários, templates, sugestões inteligentes e resumo lateral.

### Abordagem

Criar uma **nova página "Nova Proposta Inteligente"** (`/propostas/nova`) que substitui o fluxo atual de criação (botão "Nova Proposta"). A edição existente (`/propostas/:id`) continua funcionando normalmente. Ao finalizar o wizard inteligente, a proposta é salva no mesmo banco `proposals` existente.

**Não requer migração de banco** — usa apenas dados já existentes (systems_catalog, system_modules, plans, company_profile, deployment_regions, partners).

### Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/pages/PropostaInteligente.tsx` | **Criar** — página principal do wizard |
| `src/components/propostas/PropostaResumoLateral.tsx` | **Criar** — resumo lateral fixo com cálculos em tempo real |
| `src/components/propostas/PropostaComparador.tsx` | **Criar** — comparador de cenários (mensal/trimestral/anual) |
| `src/components/propostas/PropostaSugestoes.tsx` | **Criar** — painel de sugestões inteligentes |
| `src/pages/Propostas.tsx` | **Editar** — redirecionar botão "Nova" para `/propostas/nova` |
| `src/App.tsx` | **Editar** — adicionar rota `/propostas/nova` |

### Estrutura da Página PropostaInteligente

Layout: **conteúdo principal (2/3) + resumo lateral fixo (1/3)**

**Blocos do formulário principal (seções em cards):**

1. **Cliente** — Select de clientes existentes (auto-preenche dados)
2. **Sistema** — Select do catálogo → preenche `valorVenda` automaticamente
3. **Módulos** — Checkboxes dos módulos do sistema → soma valores automaticamente
4. **Plano** — Select dos planos → aplica desconto automático, mostra economia
5. **Implantação** — Select de região + km + dias → calcula valor automático usando parâmetros da company_profile
6. **Parceiro** — Select de parceiros → calcula comissão automaticamente
7. **Forma de Pagamento** — Select do catálogo
8. **Observações** — Textarea

**Resumo lateral fixo** (sticky, sempre visível):
- Sistema + valor
- Módulos selecionados + valor total
- Mensalidade base
- Desconto do plano (% + valor)
- Mensalidade final
- Implantação (detalhamento: km + região + diárias)
- Comissão do parceiro
- **Valor total da proposta**
- Botão "Gerar Proposta"

### Sugestões Inteligentes (client-side)

Lógica simples baseada em regras:
- Se plano mensal selecionado e existe plano anual → "Plano anual economiza X%"
- Se distância > 200km → "Considere implantação remota"
- Se > 3 módulos selecionados → "Pacote completo pode ser mais vantajoso"
- Se parceiro vinculado → mostra cálculo de comissão automático
- Se valor mensal alto → "Sugerir plano anual para fidelizar"

### Comparador de Cenários

Renderiza 3 cards lado a lado com os planos disponíveis, mostrando para cada:
- Mensalidade original / com desconto
- Implantação
- Economia total no período
- Comissão estimada

### Fluxo de Criação

1. Usuário preenche os campos → valores são calculados em tempo real
2. Sugestões aparecem dinamicamente conforme seleções
3. Usuário pode alternar no comparador de cenários
4. Clica "Gerar Proposta" → chama `addProposta()` do contexto existente com todos os valores preenchidos
5. Redireciona para `/propostas/:id` (página de edição existente) para ajustes finais, envio WhatsApp e PDF

### Cálculos em tempo real

```
mensalidadeBase = sistema.valorVenda + soma(modulos.valorVenda)
descontoPlano = mensalidadeBase × (plano.descontoPercentual / 100)
mensalidadeFinal = mensalidadeBase - descontoPlano
implantacao = (km × costPerKm) + regiao.baseValue + regiao.additionalFee + (dias × dailyRate)
comissaoImpl = implantacao × (partner.implantPercent / 100)
comissaoRecur = mensalidadeFinal × (partner.recurPercent / 100) × meses
valorTotal = mensalidadeFinal + implantacao
```

### Templates (fase 1 — simplificado)

Não criaremos tabela de templates nesta fase. Em vez disso, ao selecionar um sistema, o formulário já auto-preenche os módulos mais comuns daquele sistema (todos os ativos). O campo "Observações" terá um texto padrão do `crmConfig.informacoesAdicionaisPadrao`. Isso cobre 80% do valor dos templates sem complexidade adicional.

### O que NÃO será alterado
- Banco de dados (zero migrações)
- Lógica do CRM/financeiro
- Página de edição de proposta existente
- Página pública de aceite
- Geração de PDF

