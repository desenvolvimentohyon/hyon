

## Plano: Unificar Parâmetros + Configurações Gerais

### Resumo

Mover todo o conteúdo da página `Parametros.tsx` para dentro da aba "Configurações Gerais" em `Configuracoes.tsx`, usando subtabs internas para organizar o conteúdo. Remover a rota `/parametros` e o item de sidebar correspondente, adicionando um redirect para compatibilidade.

### Alterações

**1. `src/pages/Configuracoes.tsx`** — Reestruturar a aba "Configurações Gerais"

- Importar `useParametros` e toda a lógica de CRUD de sistemas, módulos, formas de pagamento, planos e alertas (atualmente em `Parametros.tsx`)
- Substituir o conteúdo da `TabsContent value="geral"` por subtabs internas:
  - **Sistemas** — tabela de sistemas (conteúdo atual de Parametros tab "sistemas")
  - **Módulos** — tabela de módulos
  - **Formas de Pagamento** — tabela de formas de pagamento
  - **Planos e Descontos** — cards de planos
  - **Propostas / CRM** — config de pipeline (já existente em Configurações Gerais)
  - **Métricas** — config de métricas e receita (já existente)
  - **Labels e Aparência** — labels de status/prioridade + modo compacto (já existente)
  - **Alertas** — config de alertas de certificado
  - **Dados** — export/import JSON (já existente)
- Mover todos os modais (Dialog) de Parametros para dentro de Configuracoes
- Remover `max-w-3xl` do container para acomodar tabelas mais largas

**2. `src/components/layout/AppSidebar.tsx`** — Remover item "Parâmetros"

- Remover `{ title: "Parâmetros", url: "/parametros", icon: Settings2 }` do grupo Configurações

**3. `src/App.tsx`** — Redirect e limpeza

- Substituir `<Route path="/parametros" element={<Parametros />} />` por `<Route path="/parametros" element={<Navigate to="/configuracoes" replace />} />`
- Remover import de `Parametros`

**4. `src/pages/Parametros.tsx`** — Manter arquivo mas ele não será mais acessado diretamente (redirect cuida)

### Estrutura visual da nova aba

```text
Configurações
├── [Minha Empresa]  (admin only, default)
└── [Configurações Gerais]
    ├── Subtab: Sistemas
    ├── Subtab: Módulos
    ├── Subtab: Formas de Pagamento
    ├── Subtab: Planos e Descontos
    ├── Subtab: Propostas / CRM
    ├── Subtab: Métricas
    ├── Subtab: Labels
    ├── Subtab: Alertas
    └── Subtab: Dados
```

### Impacto

- Nenhum dado é perdido — apenas reorganização de UI
- Todas as funções de salvar/CRUD continuam iguais
- Links antigos para `/parametros` redirecionam automaticamente para `/configuracoes`

