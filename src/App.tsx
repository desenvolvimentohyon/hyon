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

// Core Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ClientesReceita from "./pages/ClientesReceita";
import Executivo from "./pages/Executivo";
import RadarCrescimento from "./pages/RadarCrescimento";
import CheckoutInterno from "./pages/CheckoutInterno";
import Propostas from "./pages/Propostas";
import PropostaDetalhe from "./pages/PropostaDetalhe";
import PropostaInteligente from "./pages/PropostaInteligente";
import CRM from "./pages/CRM";
import Comercial from "./pages/Comercial";
import Parceiros from "./pages/Parceiros";
import Reunioes from "./pages/Reunioes";
import Tarefas from "./pages/Tarefas";
import TarefaDetalhe from "./pages/TarefaDetalhe";
import Implantacao from "./pages/Implantacao";
import Tecnicos from "./pages/Tecnicos";
import Desenvolvimento from "./pages/Desenvolvimento";
import DesenvolvimentoDetalhe from "./pages/DesenvolvimentoDetalhe";
import Configuracoes from "./pages/Configuracoes";
import UsuariosConfig from "./pages/UsuariosConfig";

// Financeiro Pages
import FinanceiroVisaoGeral from "./pages/financeiro/FinanceiroVisaoGeral";
import ContasReceber from "./pages/financeiro/ContasReceber";
import ContasPagar from "./pages/financeiro/ContasPagar";
import Lancamentos from "./pages/financeiro/Lancamentos";
import PlanoDeContas from "./pages/financeiro/PlanoDeContas";
import ConciliacaoBancaria from "./pages/financeiro/ConciliacaoBancaria";
import Relatorios from "./pages/financeiro/Relatorios";
import ConfiguracoesFinanceiras from "./pages/financeiro/ConfiguracoesFinanceiras";
import GerarMensalidades from "./pages/financeiro/GerarMensalidades";

// Cartões Pages
import CardDashboard from "./pages/cartoes/CardDashboard";
import CardClientes from "./pages/cartoes/CardClientes";
import CardPropostas from "./pages/cartoes/CardPropostas";
import CardFaturamento from "./pages/cartoes/CardFaturamento";

// Public Pages
import TicketTracking from "./pages/TicketTracking";
import PropostaPublica from "./pages/PropostaPublica";
import LandingPage from "./pages/LandingPage";
import PortalCliente from "./pages/PortalCliente";
import RenovarPlano from "./pages/RenovarPlano";
import AceiteProposta from "./pages/AceiteProposta";
import CardPropostaPublica from "./pages/cartoes/CardPropostaPublica";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
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
                          <Route path="/cartoes/proposta/:token" element={<CardPropostaPublica />} />
                          
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
                            
                            {/* Cartões */}
                            <Route path="/cartoes" element={<CardDashboard />} />
                            <Route path="/cartoes/clientes" element={<CardClientes />} />
                            <Route path="/cartoes/propostas" element={<CardPropostas />} />
                            <Route path="/cartoes/faturamento" element={<CardFaturamento />} />
                            
                            {/* Desenvolvimento */}
                            <Route path="/desenvolvimento" element={<Desenvolvimento />} />
                            <Route path="/desenvolvimento/:id" element={<DesenvolvimentoDetalhe />} />
                            
                            {/* Configurações */}
                            <Route path="/configuracoes" element={<Configuracoes />} />
                            <Route path="/usuarios" element={<UsuariosConfig />} />
                          </Route>

                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
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
