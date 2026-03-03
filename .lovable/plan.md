

# Auditoria QA Rigorosa — Hyon Tech ERP

---

## Resumo Executivo

O sistema está em estado funcional avançado com backend robusto (33 tabelas, RLS em 100% delas). A maioria dos módulos carrega e opera. Porém, existem **2 bloqueadores (P0)** que impedem uso real imediato: a aba "Minha Empresa" renderiza tela branca e o sistema dual de clientes (AppContext local vs Supabase) causa inconsistência de dados. O veredito é **NO-GO condicional** — corrigindo os P0 (estimativa: 1-2h), o sistema fica pronto para uso interno.

---

## 1. Smoke Test — Todas as Rotas

| Rota | Status | Observação |
|------|--------|------------|
| `/` (Dashboard) | ✅ | Carrega com dados, widgets, gráficos |
| `/tarefas` | ✅ | Lista funcional |
| `/comercial` | ✅ | Carrega |
| `/implantacao` | ✅ | Carrega |
| `/suporte` | ✅ | Carrega |
| `/propostas` | ✅ | Lista completa com filtros |
| `/crm` | ✅ | Pipeline Kanban |
| `/financeiro` | ✅ | Dashboard financeiro com gráficos |
| `/financeiro/contas-a-receber` | ✅ | Listagem funcional |
| `/financeiro/contas-a-pagar` | ✅ | Listagem funcional |
| `/financeiro/lancamentos` | ✅ | Funcional |
| `/financeiro/plano-de-contas` | ✅ | Hierárquico |
| `/financeiro/conciliacao-bancaria` | ✅ | Funcional |
| `/financeiro/relatorios` | ✅ | Funcional |
| `/financeiro/configuracoes` | ✅ | Funcional |
| `/clientes` | ✅ | Lista com dados do Supabase, detalhe com 9 abas |
| `/clientes-tarefas` | ⚠️ | Usa AppContext (dados locais/seed), diferente de `/clientes` |
| `/receita` | ✅ | Gráficos e métricas |
| `/tecnicos` | ✅ | Carrega |
| `/parceiros` | ✅ | CRUD funcional |
| `/executivo` | ✅ | Painel executivo |
| `/configuracoes` (Gerais) | ✅ | Labels, CRM, métricas |
| `/configuracoes` (Minha Empresa) | ❌ **TELA BRANCA** | Lazy-loaded component falha silenciosamente |
| `/usuarios` | ✅ | Gestão de usuários |
| `/parametros` | ✅ | Carrega |
| `/checkout-interno` | ✅ | Carrega |

**Console**: Warnings de `forwardRef` em componentes (não-bloqueante). Nenhum erro fatal exceto na aba Minha Empresa.

---

## 2. Problemas por Prioridade

### P0 — Bloqueadores (impedem uso real)

**P0-1: "Minha Empresa" renderiza tela branca**
- **Onde**: `/configuracoes` → aba "Minha Empresa"
- **Reprodução**: Login → Configurações → clicar na aba "Minha Empresa"
- **Causa provável**: O componente `MinhaEmpresa.tsx` usa `lazy()` import e falha silenciosamente dentro do `Suspense` boundary. Provável erro no componente (crash no render) que o Suspense engole sem mostrar fallback de erro.
- **Correção**:
  1. Adicionar `ErrorBoundary` em volta do `Suspense` em `Configuracoes.tsx`
  2. Verificar se `MinhaEmpresa.tsx` exporta corretamente como `default`
  3. Testar se o componente renderiza isoladamente

**P0-2: Sistema dual de clientes inconsistente**
- **Onde**: `/clientes` (Supabase real) vs `/clientes-tarefas` (AppContext local)
- **Impacto**: Dois cadastros de clientes diferentes apontando para fontes de dados distintas. Ao criar cliente em uma rota, não aparece na outra.
- **Correção**:
  1. Decidir qual é o módulo principal (recomendo `/clientes` com Supabase)
  2. Remover ou converter `/clientes-tarefas` para usar a mesma fonte
  3. Ou ao menos esconder a rota duplicada do sidebar

### P1 — Importantes (funcionalidade comprometida)

**P1-1: Nenhum `updated_at` trigger configurado**
- **Onde**: Banco de dados
- **Impacto**: A função `handle_updated_at()` existe mas não há triggers registrados (`db-triggers` vazio). O campo `updated_at` nunca é atualizado automaticamente.
- **Correção**: Criar triggers para todas as tabelas com coluna `updated_at`:
  ```sql
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  -- Repetir para: profiles, company_profile, company_bank_accounts, 
  -- proposals, financial_titles, partners, etc.
  ```

**P1-2: Leaked Password Protection desabilitada**
- **Onde**: Configuração de autenticação
- **Impacto**: Usuários podem usar senhas conhecidamente comprometidas
- **Correção**: Habilitar via configuração de auth (leak protection)

**P1-3: Tabelas com RLS parcial (faltam operações)**
- `asaas_webhook_events`: apenas SELECT (sem INSERT/UPDATE/DELETE por usuários) — OK se inserido apenas via service_role
- `bank_transactions`: sem DELETE — intencional mas risco se precisar corrigir lançamento
- `monthly_adjustments`: sem DELETE — intencional
- `organizations`: sem INSERT/DELETE — OK, gerenciado por trigger
- `contract_adjustments`: sem UPDATE/DELETE — pode precisar de correção

**P1-4: Ações destrutivas sem confirmação**
- **Onde**: Botões de excluir contato, excluir conta bancária (MinhaEmpresa), botões de resetar dados
- **Correção**: Adicionar `AlertDialog` de confirmação antes de exclusões

### P2 — Melhorias (qualidade e polimento)

**P2-1: Dados do seed executam automaticamente no login**
- `AuthContext.tsx` linha 59: `seedOrg()` é chamado em cada `SIGNED_IN`. Se o seed já foi feito, gera chamada desnecessária ao edge function.
- **Correção**: Já existe check `already_seeded`, mas a chamada ainda gera latência desnecessária.

**P2-2: Máscaras incompletas em alguns campos**
- CNPJ na criação de cliente em `/clientes` tem máscara, mas na edição (detalhe) o campo exibe o valor sem máscara
- CEP sem máscara nos campos de endereço do cliente
- Telefone sem máscara consistente

**P2-3: Botão "Salvar Alterações" no rodapé do ClienteDetalhe** 
- O rodapé fixo com `left-0 right-0` sobrepõe a sidebar. Deve respeitar o padding do layout.
- **Correção**: Usar `left-[var(--sidebar-width)]` ou posicionar dentro do container principal.

**P2-4: `address_city` vs `city` duplicado na tabela `clients`**
- A tabela `clients` tem `city` (antigo) e `address_*` (novo). `city` continua sendo usado em `ClientesReceita` mas o detalhe usa `address_*`. Potencial confusão.

**P2-5: Console warnings de `forwardRef`**
- Múltiplos warnings "Function components cannot be given refs" no `Skeleton` e `Select`
- Não-bloqueante mas poluem o console

---

## 3. Segurança e RLS

| Aspecto | Status |
|---------|--------|
| RLS habilitado em todas as 33 tabelas | ✅ |
| Isolamento por `org_id` via `current_org_id()` | ✅ |
| Admin-only para operações destrutivas | ✅ |
| `security definer` em funções auxiliares | ✅ |
| Edge functions sem vazamento de segredos | ✅ (segredos no Vault) |
| Rate limit no CNPJ lookup | ⚠️ Não verificado, sem evidência de throttle |
| Leaked password protection | ❌ Desabilitada |

---

## 4. Integridade de Dados

| Verificação | Status |
|-------------|--------|
| `updated_at` auto-atualizado | ❌ Triggers ausentes |
| FK constraints coerentes | ⚠️ Sem FK explícitas em `clients` para `plans`, `partners` etc. |
| Unique CNPJ por org | ⚠️ Não há constraint `UNIQUE(org_id, document)` na tabela `clients` |
| Idempotência de comissões | ✅ Flags `commission_generated` e `commission_implant_generated` |
| Campos obrigatórios com NOT NULL | ✅ `name`, `org_id`, `status` são NOT NULL |

---

## 5. Performance

Nenhum gargalo crítico identificado. O dashboard carrega em <2s com dados de seed. Queries usam filtros por `org_id` (RLS). Sem paginação na lista de clientes (pode ser problema com >100 clientes), mas aceitável para uso interno inicial.

---

## 6. Veredito

### **NO-GO (condicional)**

O sistema **não está pronto** para uso real imediato por causa de:

1. **P0-1**: Aba "Minha Empresa" (cadastro institucional) não renderiza — impede configurar dados da empresa
2. **P0-2**: Duplicidade de módulo de clientes causa confusão operacional

### Caminho para GO

Correções necessárias (estimativa: 1-2h de desenvolvimento):

1. Corrigir o crash do componente `MinhaEmpresa` (adicionar ErrorBoundary, debugar o render)
2. Unificar ou esconder a rota duplicada de clientes (`/clientes-tarefas`)
3. Criar triggers de `updated_at` para todas as tabelas relevantes
4. Habilitar leaked password protection

Após essas 4 correções, o sistema está em condição de **GO para uso interno** com os riscos conhecidos (P2) documentados e aceitos.

### Recomendações pós-GO

- Monitorar erros no console periodicamente
- Implementar exportação/backup JSON semanal (já existe botão em Configurações)
- Adicionar paginação nas listagens quando ultrapassar 50 registros
- Adicionar constraint `UNIQUE(org_id, document)` em `clients` para evitar CNPJ duplicado

