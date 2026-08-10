import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { FinanceiroProvider } from "./contexts/FinanceiroContext";
import { ReceitaProvider } from "./contexts/ReceitaContext";
import { PropostasProvider } from "./contexts/PropostasContext";
import { ParametrosProvider } from "./contexts/ParametrosContext";
import { AuthProvider } from "./contexts/AuthContext";
import { UsersProvider } from "./contexts/UsersContext";
import { AppLayout } from "./components/layout/AppLayout";

import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Loading Fallback
const LoadingPage = () => (
  <div className="flex h-screen items-center justify-center bg-background p-8">
    <div className="space-y-4 w-full max-w-md animate-pulse">
      <Skeleton className="h-8 w-48 mx-auto rounded-lg" />
      <Skeleton className="h-4 w-64 mx-auto rounded-lg" />
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  </div>
);

// Lazy Loaded Pages
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ClientesReceita = lazy(() => import("./pages/ClientesReceita"));
const Executivo = lazy(() => import("./pages/Executivo"));
const RadarCrescimento = lazy(() => import("./pages/RadarCrescimento"));
const CheckoutInterno = lazy(() => import("./pages/CheckoutInterno"));
const Propostas = lazy(() => import("./pages/Propostas"));
const PropostaDetalhe = lazy(() => import("./pages/PropostaDetalhe"));
const PropostaInteligente = lazy(() => import("./pages/PropostaInteligente"));
const CRM = lazy(() => import("./pages/CRM"));
const Comercial = lazy(() => import("./pages/Comercial"));
const Parceiros = lazy(() => import("./pages/Parceiros"));
const Reunioes = lazy(() => import("./pages/Reunioes"));
const Suporte = lazy(() => import("./pages/Suporte"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const TarefaDetalhe = lazy(() => import("./pages/TarefaDetalhe"));
const Implantacao = lazy(() => import("./pages/Implantacao"));
const Tecnicos = lazy(() => import("./pages/Tecnicos"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const UsuariosConfig = lazy(() => import("./pages/UsuariosConfig"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Financeiro
const FinanceiroVisaoGeral = lazy(() => import("./pages/financeiro/FinanceiroVisaoGeral"));
const ContasReceber = lazy(() => import("./pages/financeiro/ContasReceber"));
const ContasPagar = lazy(() => import("./pages/financeiro/ContasPagar"));
const Lancamentos = lazy(() => import("./pages/financeiro/Lancamentos"));
const PlanoDeContas = lazy(() => import("./pages/financeiro/PlanoDeContas"));
const ConciliacaoBancaria = lazy(() => import("./pages/financeiro/ConciliacaoBancaria"));
const Relatorios = lazy(() => import("./pages/financeiro/Relatorios"));
const ConfiguracoesFinanceiras = lazy(() => import("./pages/financeiro/ConfiguracoesFinanceiras"));
const GerarMensalidades = lazy(() => import("./pages/financeiro/GerarMensalidades"));

// Public
const TicketTracking = lazy(() => import("./pages/TicketTracking"));
const PropostaPublica = lazy(() => import("./pages/PropostaPublica"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PortalCliente = lazy(() => import("./pages/PortalCliente"));
const RenovarPlano = lazy(() => import("./pages/RenovarPlano"));
const AceiteProposta = lazy(() => import("./pages/AceiteProposta"));
const ReuniaoPublica = lazy(() => import("./pages/ReuniaoPublica"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // Default 5 min stale
      gcTime: 1000 * 60 * 30,    // Keep in cache for 30 min
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UsersProvider>
          <AppProvider>
            <FinanceiroProvider>
              <ReceitaProvider>
                <PropostasProvider>
                  <ParametrosProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner position="top-right" closeButton />
                      <BrowserRouter>
                        <Suspense fallback={<LoadingPage />}>
                          <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Auth />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/bio" element={<LandingPage />} />
                            <Route path="/suporte/rastreio/:protocolo" element={<TicketTracking />} />
                            <Route path="/proposta/:token" element={<PropostaPublica />} />
                            <Route path="/portal/:token" element={<PortalCliente />} />
                            <Route path="/renovar/:token" element={<RenovarPlano />} />
                            <Route path="/aceite/:numero" element={<AceiteProposta />} />
                            <Route path="/reuniao/:token" element={<ReuniaoPublica />} />
                            
                            {/* Protected Routes */}
                            <Route element={<AppLayout />}>
                              <Route path="/" element={<Dashboard />} />
                              
                              {/* Inteligência */}
                              <Route path="/executivo" element={<Executivo />} />
                              <Route path="/radar" element={<RadarCrescimento />} />
                              
                              {/* Clientes */}
                              <Route path="/clientes" element={<ClientesReceita />} />
                              <Route path="/checkout-interno" element={<CheckoutInterno />} />
                              
                              {/* Comercial */}
                              <Route path="/propostas" element={<Propostas />} />
                              <Route path="/propostas/:id" element={<PropostaDetalhe />} />
                              <Route path="/proposta-inteligente" element={<PropostaInteligente />} />
                              <Route path="/crm" element={<CRM />} />
                              <Route path="/comercial" element={<Comercial />} />
                              <Route path="/parceiros" element={<Parceiros />} />
                              
                              {/* Financeiro */}
                              <Route path="/financeiro" element={<FinanceiroVisaoGeral />} />
                              <Route path="/financeiro/contas-a-receber" element={<ContasReceber />} />
                              <Route path="/financeiro/contas-a-pagar" element={<ContasPagar />} />
                              <Route path="/financeiro/lancamentos" element={<Lancamentos />} />
                              <Route path="/financeiro/plano-de-contas" element={<PlanoDeContas />} />
                              <Route path="/financeiro/conciliacao-bancaria" element={<ConciliacaoBancaria />} />
                              <Route path="/financeiro/relatorios" element={<Relatorios />} />
                              <Route path="/financeiro/configuracoes" element={<ConfiguracoesFinanceiras />} />
                              <Route path="/financeiro/gerar-mensalidades" element={<GerarMensalidades />} />
                              
                              {/* Operacional */}
                              <Route path="/suporte" element={<Suporte />} />
                              <Route path="/reunioes" element={<Reunioes />} />
                              <Route path="/tarefas" element={<Tarefas />} />
                              <Route path="/tarefas/:id" element={<TarefaDetalhe />} />
                              <Route path="/implantacao" element={<Implantacao />} />
                              <Route path="/tecnicos" element={<Tecnicos />} />
                              
                              {/* Configurações */}
                              <Route path="/configuracoes" element={<Configuracoes />} />
                              <Route path="/usuarios" element={<UsuariosConfig />} />
                            </Route>

                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </BrowserRouter>
                    </TooltipProvider>
                  </ParametrosProvider>
                </PropostasProvider>
              </ReceitaProvider>
            </FinanceiroProvider>
          </AppProvider>
        </UsersProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
