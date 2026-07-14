import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, BarChart3, Clock, FileCheck2, ListChecks } from "lucide-react";
import logoHyonVertical from "@/assets/logo-hyon-vertical.png";

const DISPLAY_FONT =
  "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif";

const modules = [
  { icon: BarChart3, title: "Financeiro Avançado", subtitle: "DRE e MRR em tempo real" },
  { icon: Clock, title: "Suporte e SLA", subtitle: "Controle total de chamados" },
  { icon: FileCheck2, title: "Propostas e Vendas", subtitle: "Assinatura digital integrada" },
  { icon: ListChecks, title: "Tarefas com Timer", subtitle: "Rentabilidade por projeto" },
];

export default function Auth() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleForgot = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Recuperação de senha",
      description: "Entre em contato com o administrador da sua organização para redefinir a senha.",
    });
  };

  return (
    <div className="h-screen w-full bg-[#0a0f18] flex items-center justify-center p-0 md:p-4 font-sans overflow-hidden">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
      />
      <div className="max-w-6xl w-full h-full md:h-auto md:max-h-[calc(100vh-2rem)] grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-[#0d141f] rounded-none md:rounded-2xl border-0 md:border md:border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
        {/* Narrative */}
        <aside className="order-2 md:order-1 md:col-span-7 lg:col-span-8 p-6 md:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0a0f18] to-[#161d2a]">
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-teal-500/10 blur-[110px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <img src={logoHyonVertical} alt="Hyon Tecnologia" className="h-10 w-auto drop-shadow-lg" />
            </div>

            <h1
              className="text-2xl md:text-3xl lg:text-[2.4rem] text-white mb-3 leading-[1.1] max-w-xl font-semibold tracking-tight"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Gestão empresarial <span className="text-teal-400">360°</span> para o seu negócio B2B.
            </h1>
            <p
              className="text-gray-400 text-sm md:text-base max-w-md mb-6"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Acompanhe MRR, controle SLAs e automatize propostas em uma única plataforma integrada.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.title}
                    className="bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-sm hover:border-teal-500/30 hover:bg-white/[0.07] transition-all"
                  >
                    <Icon className="w-5 h-5 text-teal-400 mb-1.5" strokeWidth={1.5} />
                    <div
                      className="text-white text-sm font-semibold leading-tight"
                      style={{ fontFamily: DISPLAY_FONT }}
                    >
                      {m.title}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: DISPLAY_FONT }}>
                      {m.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="relative z-10 mt-5 pt-3 border-t border-white/5 flex flex-wrap gap-x-5 gap-y-1.5 items-center opacity-70"
            style={{ fontFamily: DISPLAY_FONT }}
          >
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">
              Integração nativa
            </span>
            <span className="text-xs text-white font-bold tracking-tight">ASAAS</span>
            <span className="text-xs text-white font-bold tracking-tight">Certificado A1</span>
            <span className="text-xs text-white font-bold tracking-tight">Portal Cliente</span>
          </div>
        </aside>

        {/* Login */}
        <section
          className="order-1 md:order-2 md:col-span-5 lg:col-span-4 bg-[#0a0f18] p-6 md:p-8 lg:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-l border-white/5 relative"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 blur-[90px] rounded-full pointer-events-none" />

          <div className="max-w-sm mx-auto w-full relative z-10">
            <div className="mb-5 text-center md:text-left">
              <h2 className="text-2xl lg:text-[1.7rem] text-white font-semibold tracking-tight leading-tight">
                Bem-vindo de volta
              </h2>
              <p className="text-gray-500 text-sm mt-1">Acesse sua central de comando.</p>
            </div>

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5"
                >
                  E-mail Corporativo
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@empresa.com.br"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="text-[10px] text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-wider font-semibold"
                  >
                    Esqueceu?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-0.5">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 checked:bg-teal-500 checked:border-teal-500 transition-all"
                  />
                  <svg
                    className="absolute h-3 w-3 pointer-events-none hidden peer-checked:block text-[#0a0f18] left-[2px]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={4}
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Manter conectado</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-400 text-[#0a0f18] font-bold text-sm py-3 rounded-lg transition-all shadow-[0_10px_30px_rgba(20,184,166,0.2)] hover:shadow-[0_15px_40px_rgba(20,184,166,0.3)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 mt-1"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar no Sistema
              </button>
            </form>

            <div className="mt-5 text-center md:text-left">
              <p className="text-xs text-gray-500">
                Acesso restrito. Solicite credenciais ao administrador.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
