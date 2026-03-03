import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { PropostasProvider } from "@/contexts/PropostasContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Tarefas from "./pages/Tarefas";
import TarefaDetalhe from "./pages/TarefaDetalhe";
import Clientes from "./pages/Clientes";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <PropostasProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tarefas" element={<Tarefas />} />
                <Route path="/tarefas/:id" element={<TarefaDetalhe />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/tecnicos" element={<Tecnicos />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/comercial" element={<Comercial />} />
                <Route path="/implantacao" element={<Implantacao />} />
                <Route path="/suporte" element={<Suporte />} />
                <Route path="/executivo" element={<Executivo />} />
                <Route path="/propostas" element={<Propostas />} />
                <Route path="/propostas/:id" element={<PropostaDetalhe />} />
                <Route path="/crm" element={<CRM />} />
              </Route>
              <Route path="/aceite/:numero" element={<AceiteProposta />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PropostasProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
