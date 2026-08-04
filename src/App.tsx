import { lazy, Suspense, memo, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { PropostasProvider } from "@/contexts/PropostasContext";
import { ReceitaProvider } from "@/contexts/ReceitaContext";
import { FinanceiroProvider } from "@/contexts/FinanceiroContext";
import { UsersProvider } from "@/contexts/UsersContext";
import { ParametrosProvider } from "@/contexts/ParametrosContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { GlobalErrorBoundary } from "@/shared/components/GlobalErrorBoundary";
import Auth from "./pages/Auth";


// Lazy-loaded pages with consistent naming
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RadarCrescimento = lazy(() => import("./pages/RadarCrescimento"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const TarefaDetalhe = lazy(() => import("./pages/TarefaDetalhe"));
const ClientesReceita = lazy(() => import("./pages/ClientesReceita"));
const Receita = lazy(() => import("./pages/Receita"));
const Tecnicos = lazy(() => import("./pages/Tecnicos"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Comercial = lazy(() => import("./pages/Comercial"));
const Implantacao = lazy(() => import("./pages/Implantacao"));
const Suporte = lazy(() => import("./pages/Suporte"));
const Executivo = lazy(() => import("./pages/Executivo"));
const Propostas = lazy(() => import("./pages/Propostas"));
const PropostaDetalhe = lazy(() => import("./pages/PropostaDetalhe"));
const PropostaInteligente = lazy(() => import("./pages/PropostaInteligente"));
const CRM = lazy(() => import("./pages/CRM"));
const AceiteProposta = lazy(() => import("./pages/AceiteProposta"));
const PropostaPublica = lazy(() => import("./pages/PropostaPublica"));
const UsuariosConfig = lazy(() => import("./pages/UsuariosConfig"));
const AcessoNegado = lazy(() => import("./pages/AcessoNegado"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PortalCliente = lazy(() => import("./pages/PortalCliente"));
const CheckoutInterno = lazy(() => import("./pages/CheckoutInterno"));
const Parceiros = lazy(() => import("./pages/Parceiros"));
const CardDashboard = lazy(() => import("./pages/cartoes/CardDashboard"));
const CardClientes = lazy(() => import("./pages/cartoes/CardClientes"));
const CardClienteDetalhe = lazy(() => import("./pages/cartoes/CardClienteDetalhe"));
const CardPropostas = lazy(() => import("./pages/cartoes/CardPropostas"));
const CardFaturamento = lazy(() => import("./pages/cartoes/CardFaturamento"));
const CardPropostaPublica = lazy(() => import("./pages/cartoes/CardPropostaPublica"));
const RenovarPlano = lazy(() => import("./pages/RenovarPlano"));
const TicketTracking = lazy(() => import("./pages/TicketTracking"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Reunioes = lazy(() => import("./pages/Reunioes"));

const Desenvolvimento = lazy(() => import("./pages/Desenvolvimento"));
const DesenvolvimentoDetalhe = lazy(() => import("./pages/DesenvolvimentoDetalhe"));
const FinanceiroVisaoGeral = lazy(() => import("./pages/financeiro/FinanceiroVisaoGeral"));
const ContasReceber = lazy(() => import("./pages/financeiro/ContasReceber"));
const ContasPagar = lazy(() => import("./pages/financeiro/ContasPagar"));
const PlanoDeContas = lazy(() => import("./pages/financeiro/PlanoDeContas"));
const ConciliacaoBancaria = lazy(() => import("./pages/financeiro/ConciliacaoBancaria"));
const Lancamentos = lazy(() => import("./pages/financeiro/Lancamentos"));
const Relatorios = lazy(() => import("./pages/financeiro/Relatorios"));
const ConfiguracoesFinanceiras = lazy(() => import("./pages/financeiro/ConfiguracoesFinanceiras"));
const GerarMensalidades = lazy(() => import("./pages/financeiro/GerarMensalidades"));

function AceiteRedirect() {
  const { numero } = useParams<{ numero: string }>();
  return <Navigate to={`/proposta/${numero}`} replace />;
}

const PageSkeleton = memo(() => (
  <div className="flex flex-col h-full p-4 sm:p-6 animate-pulse space-y-6 overflow-hidden">
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 sm:h-10 w-40 sm:w-48 rounded-lg" />
      <Skeleton className="h-9 sm:h-10 w-24 sm:w-32 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <Skeleton className="h-28 sm:h-32 rounded-xl" />
      <Skeleton className="h-28 sm:h-32 rounded-xl" />
      <Skeleton className="h-28 sm:h-32 rounded-xl hidden lg:block" />
    </div>
    <Skeleton className="h-[300px] sm:h-[400px] w-full rounded-xl" />
  </div>
));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AuthGate() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Prefetch de dados críticos ao entrar
      queryClient.prefetchQuery({
        queryKey: ["intelligence_metrics"],
        queryFn: async () => { /* ... */ }
      });
    }
  }, [user]);



  if (loading) return <PageSkeleton />;

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <UsersProvider>
      <ParametrosProvider>
        <AppProvider>
          <PropostasProvider>
            <ReceitaProvider>
              <FinanceiroProvider>
                <Suspense fallback={<PageSkeleton />}>
                  <Routes>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/executivo" element={<Executivo />} />
                      <Route path="/radar" element={<RadarCrescimento />} />
                      <Route path="/clientes" element={<ClientesReceita />} />
                      <Route path="/receita" element={<Receita />} />
                      <Route path="/comercial" element={<Comercial />} />
                      <Route path="/implantacao" element={<Implantacao />} />
                      <Route path="/suporte" element={<Suporte />} />
                      <Route path="/tecnicos" element={<Tecnicos />} />
                      <Route path="/configuracoes" element={<Configuracoes />} />
                      <Route path="/reunioes" element={<Reunioes />} />
                      <Route path="/tarefas" element={<Tarefas />} />
                      <Route path="/tarefas/:id" element={<TarefaDetalhe />} />
                      <Route path="/propostas" element={<Propostas />} />
                      <Route path="/propostas/:id" element={<PropostaDetalhe />} />
                      <Route path="/proposta-inteligente" element={<PropostaInteligente />} />
                      <Route path="/crm" element={<CRM />} />
                      <Route path="/usuarios" element={<UsuariosConfig />} />
                      <Route path="/parametros" element={<Navigate to="/configuracoes" replace />} />
                      <Route path="/acesso-negado" element={<AcessoNegado />} />
                      <Route path="/parceiros" element={<Parceiros />} />
                      <Route path="/checkout-interno" element={<CheckoutInterno />} />
                      <Route path="/desenvolvimento" element={<Desenvolvimento />} />
                      <Route path="/desenvolvimento/:id" element={<DesenvolvimentoDetalhe />} />
                      <Route path="/cartoes" element={<CardDashboard />} />
                      <Route path="/cartoes/clientes" element={<CardClientes />} />
                      <Route path="/cartoes/clientes/:id" element={<CardClienteDetalhe />} />
                      <Route path="/cartoes/propostas" element={<CardPropostas />} />
                      <Route path="/cartoes/faturamento" element={<CardFaturamento />} />
                      <Route path="/financeiro" element={<FinanceiroVisaoGeral />} />
                      <Route path="/financeiro/contas-a-receber" element={<ContasReceber />} />
                      <Route path="/financeiro/contas-a-pagar" element={<ContasPagar />} />
                      <Route path="/financeiro/plano-de-contas" element={<PlanoDeContas />} />
                      <Route path="/financeiro/conciliacao-bancaria" element={<ConciliacaoBancaria />} />
                      <Route path="/financeiro/lancamentos" element={<Lancamentos />} />
                      <Route path="/financeiro/relatorios" element={<Relatorios />} />
                      <Route path="/financeiro/configuracoes" element={<ConfiguracoesFinanceiras />} />
                      <Route path="/financeiro/gerar-mensalidades" element={<GerarMensalidades />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </FinanceiroProvider>
            </ReceitaProvider>
          </PropostasProvider>
        </AppProvider>
      </ParametrosProvider>
    </UsersProvider>
  );
}

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/aceite/:numero" element={<AceiteRedirect />} />
                <Route path="/bio" element={<LandingPage />} />
                <Route path="/landing" element={<Navigate to="/bio" replace />} />
                <Route path="/proposta/:token" element={<PropostaPublica />} />
                <Route path="/portal/:token" element={<PortalCliente />} />
                <Route path="/cartoes/proposta/:token" element={<CardPropostaPublica />} />
                <Route path="/renovar/:token" element={<RenovarPlano />} />
                <Route path="/acompanhamento" element={<TicketTracking />} />
                <Route path="*" element={<AuthGate />} />
              </Routes>
            </Suspense>
            <PwaInstallBanner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
