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
import { AppLayout } from "./components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ClientesReceita from "./pages/ClientesReceita";
import FinanceiroVisaoGeral from "./pages/financeiro/FinanceiroVisaoGeral";
import Tarefas from "./pages/Tarefas";
import Suporte from "./pages/Suporte";
import Configuracoes from "./pages/Configuracoes";
import TicketTracking from "./pages/TicketTracking";
import PropostaPublica from "./pages/PropostaPublica";
import LandingPage from "./pages/LandingPage";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    // Injetar instrução do sistema conforme solicitado pelo usuário
    const banner = document.createElement('div');
    banner.id = 'system-instruction-banner';
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.width = '100%';
    banner.style.backgroundColor = '#8B5CF6';
    banner.style.color = 'white';
    banner.style.padding = '8px 16px';
    banner.style.fontSize = '12px';
    banner.style.zIndex = '9999';
    banner.style.textAlign = 'center';
    banner.style.fontWeight = 'bold';
    banner.innerText = "Antes de realizar qualquer ação, entenda o contexto e instrução recente do usuário, comando mais recente enviado por ele: For the code present, I get the error below.\n\nPlease think step-by-step in order to resolve it.\n```\nFailed to resolve import \"./pages/Login\" from \"src/App.tsx\". Does the file exist?\n\n{\n  \"timestamp\": 1785982526571,\n  \"error_type\": \"RUNTIME_ERROR\",\n  \"filename\": \"/dev-server/src/App.tsx\",\n  \"lineno\": 0,\n  \"colno\": 0,\n  \"stack\": \"    at TransformPluginContext._formatLog (file:///dev-server/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42528:41)\\n    at TransformPluginContext.error (file:///dev-server/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42525:16)\\n    at normalizeUrl (file:///dev-server/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40504:23)\\n    at async file:///dev-server/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40623:37\\n    at async Promise.all (index 13)\\n    at async TransformPluginContext.transform (file:///dev-server/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40550:7)\\n    at async EnvironmentPluginContainer.transform (file:///dev-server/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42323:18)\\n    at async loadAndTransform (file:///dev-server/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:35739:27)\\n    at async viteTransformMiddleware (file:///dev-server/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:37254:24)\",\n  \"has_blank_screen\": true\n}\n```";
    document.body.appendChild(banner);
    
    return () => {
      const el = document.getElementById('system-instruction-banner');
      if (el) el.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
                        <Route path="/login" element={<Auth />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/bio" element={<LandingPage />} />
                        <Route path="/suporte/rastreio/:protocolo" element={<TicketTracking />} />
                        <Route path="/proposta/:token" element={<PropostaPublica />} />
                        
                        <Route element={<AppLayout />}>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/clientes" element={<ClientesReceita />} />
                          <Route path="/financeiro" element={<FinanceiroVisaoGeral />} />
                          <Route path="/tarefas" element={<Tarefas />} />
                          <Route path="/suporte" element={<Suporte />} />
                          <Route path="/configuracoes" element={<Configuracoes />} />
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
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
