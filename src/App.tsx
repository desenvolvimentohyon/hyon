import { lazy, Suspense } from "react";
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
import Auth from "./pages/Auth";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
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
const RadarCrescimento = lazy(() => import("./pages/RadarCrescimento"));
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
const Cockpit = lazy(() => import("./pages/Cockpit"));
const FinanceiroVisaoGeral = lazy(() => import("./pages/financeiro/FinanceiroVisaoGeral"));
const ContasReceber = lazy(() => import("./pages/financeiro/ContasReceber"));
const ContasPagar = lazy(() => import("./pages/financeiro/ContasPagar"));
const PlanoDeContas = lazy(() => import("./pages/financeiro/PlanoDeContas"));
const ConciliacaoBancaria = lazy(() => import("./pages/financeiro/ConciliacaoBancaria"));
const Lancamentos = lazy(() => import("./pages/financeiro/Lancamentos"));
const Relatorios = lazy(() => import("./pages/financeiro/Relatorios"));
const ConfiguracoesFinanceiras = lazy(() => import("./pages/financeiro/ConfiguracoesFinanceiras"));

function AceiteRedirect() {
  const { numero } = useParams<{ numero: string }>();
  return <Navigate to={`/proposta/${numero}`} replace />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

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
                      <Route path="/cockpit" element={<Cockpit />} />
                      <Route path="/tarefas" element={<Tarefas />} />
                      <Route path="/tarefas/:id" element={<TarefaDetalhe />} />
                      <Route path="/clientes" element={<ClientesReceita />} />
                      <Route path="/receita" element={<Receita />} />
                      <Route path="/tecnicos" element={<Tecnicos />} />
                      <Route path="/configuracoes" element={<Configuracoes />} />
                      <Route path="/comercial" element={<Comercial />} />
                      <Route path="/implantacao" element={<Implantacao />} />
                      <Route path="/suporte" element={<Suporte />} />
                      <Route path="/executivo" element={<Executivo />} />
                      <Route path="/radar-crescimento" element={<RadarCrescimento />} />
                      <Route path="/propostas" element={<Propostas />} />
                      <Route path="/propostas/nova" element={<PropostaInteligente />} />
                      <Route path="/propostas/:id" element={<PropostaDetalhe />} />
                      <Route path="/crm" element={<CRM />} />
                      <Route path="/usuarios" element={<UsuariosConfig />} />
                      <Route path="/parametros" element={<Navigate to="/configuracoes" replace />} />
                      <Route path="/acesso-negado" element={<AcessoNegado />} />
                      <Route path="/parceiros" element={<Parceiros />} />
                      <Route path="/checkout-interno" element={<CheckoutInterno />} />
                      {/* Cartões */}
                      <Route path="/cartoes" element={<CardDashboard />} />
                      <Route path="/cartoes/clientes" element={<CardClientes />} />
                      <Route path="/cartoes/clientes/:id" element={<CardClienteDetalhe />} />
                      <Route path="/cartoes/propostas" element={<CardPropostas />} />
                      <Route path="/cartoes/faturamento" element={<CardFaturamento />} />
                      {/* Financeiro */}
                      <Route path="/financeiro" element={<FinanceiroVisaoGeral />} />
                      <Route path="/financeiro/contas-a-receber" element={<ContasReceber />} />
                      <Route path="/financeiro/contas-a-pagar" element={<ContasPagar />} />
                      <Route path="/financeiro/plano-de-contas" element={<PlanoDeContas />} />
                      <Route path="/financeiro/conciliacao-bancaria" element={<ConciliacaoBancaria />} />
                      <Route path="/financeiro/lancamentos" element={<Lancamentos />} />
                      <Route path="/financeiro/relatorios" element={<Relatorios />} />
                      <Route path="/financeiro/configuracoes" element={<ConfiguracoesFinanceiras />} />
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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/aceite/:numero" element={<AceiteRedirect />} />
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
);

export default App;
