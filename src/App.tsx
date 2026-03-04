import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Dashboard from "./pages/Dashboard";
import Tarefas from "./pages/Tarefas";
import TarefaDetalhe from "./pages/TarefaDetalhe";

import ClientesReceita from "./pages/ClientesReceita";
import Receita from "./pages/Receita";
import Tecnicos from "./pages/Tecnicos";
import Configuracoes from "./pages/Configuracoes";
import Comercial from "./pages/Comercial";
import Implantacao from "./pages/Implantacao";
import Suporte from "./pages/Suporte";
import Executivo from "./pages/Executivo";
import Propostas from "./pages/Propostas";
import PropostaDetalhe from "./pages/PropostaDetalhe";
import CRM from "./pages/CRM";
import AceiteProposta from "./pages/AceiteProposta";
import PropostaPublica from "./pages/PropostaPublica";
import UsuariosConfig from "./pages/UsuariosConfig";
import Parametros from "./pages/Parametros";
import AcessoNegado from "./pages/AcessoNegado";
import NotFound from "./pages/NotFound";
import PortalCliente from "./pages/PortalCliente";
import CheckoutInterno from "./pages/CheckoutInterno";
import Parceiros from "./pages/Parceiros";
// Financeiro
import FinanceiroVisaoGeral from "./pages/financeiro/FinanceiroVisaoGeral";
import ContasReceber from "./pages/financeiro/ContasReceber";
import ContasPagar from "./pages/financeiro/ContasPagar";
import PlanoDeContas from "./pages/financeiro/PlanoDeContas";
import ConciliacaoBancaria from "./pages/financeiro/ConciliacaoBancaria";
import Lancamentos from "./pages/financeiro/Lancamentos";
import Relatorios from "./pages/financeiro/Relatorios";
import ConfiguracoesFinanceiras from "./pages/financeiro/ConfiguracoesFinanceiras";

const queryClient = new QueryClient();

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
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
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
                    <Route path="/propostas" element={<Propostas />} />
                    <Route path="/propostas/:id" element={<PropostaDetalhe />} />
                    <Route path="/crm" element={<CRM />} />
                    <Route path="/usuarios" element={<UsuariosConfig />} />
                    <Route path="/parametros" element={<Parametros />} />
                    <Route path="/acesso-negado" element={<AcessoNegado />} />
                    <Route path="/parceiros" element={<Parceiros />} />
                    <Route path="/checkout-interno" element={<CheckoutInterno />} />
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
                  <Route path="/aceite/:numero" element={<AceiteProposta />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
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
          <Routes>
            <Route path="/aceite/:numero" element={<AceiteProposta />} />
            <Route path="/proposta/:token" element={<PropostaPublica />} />
            <Route path="/portal/:token" element={<PortalCliente />} />
            <Route path="*" element={<AuthGate />} />
          </Routes>
          <PwaInstallBanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
