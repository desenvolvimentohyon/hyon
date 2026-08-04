# Documentação Técnica do Projeto - Hyon ERP SaaS

## Arquitetura
O projeto segue uma arquitetura modular baseada em **Domínios (Features)** e **Camadas (Core/Shared/Services)**.

### Estrutura de Pastas
- `src/core/`: Lógica central (Auth, Config, Logger, Feature Flags).
- `src/features/`: Módulos de negócio (Dashboard, Clientes, Financeiro).
- `src/services/`: Integração com Supabase via TanStack Query (Camada de Dados).
- `src/shared/`: Componentes, hooks e utilitários reutilizáveis.
- `src/integrations/`: Auto-gerado (Supabase Client).

## Padrões Adotados
- **Performance**: Lazy Loading em 100% das rotas, caching agressivo com React Query.
- **Segurança**: RLS obrigatório em todas as tabelas, isolamento por `org_id`.
- **UI/UX**: Design System baseado em Shadcn/UI, Dark Mode nativo, responsividade mobile-first.
- **Código**: TypeScript Strict, Clean Code, Solid Principles.

## Segurança e Permissões
O sistema utiliza um RBAC (Role-Based Access Control) robusto. As permissões são validadas tanto no Frontend (Sidebar/Rotas) quanto no Backend (RLS/Edge Functions).

## Monitoramento
Logger centralizado pronto para integração com Sentry/PostHog.
