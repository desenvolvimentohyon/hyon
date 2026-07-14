import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, BarChart3, Clock, FileCheck2, ListChecks } from "lucide-react";
import logoHyonVertical from "@/assets/logo-hyon-vertical.png";

const modules = [
  {
    icon: BarChart3,
    title: "Financeiro Avançado",
    subtitle: "DRE & MRR em tempo real",
  },
  {
    icon: Clock,
    title: "Suporte & SLA",
    subtitle: "Controle total de chamados",
  },
  {
    icon: FileCheck2,
    title: "Propostas & Vendas",
    subtitle: "Assinatura digital integrada",
  },
  {
    icon: ListChecks,
    title: "Tarefas com Timer",
    subtitle: "Rentabilidade por projeto",
  },
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
    <div className="min-h-screen w-full bg-[#0a0f18] flex items-center justify-center p-0 md:p-6 lg:p-10 font-sans">
      <div className="max-w-7xl w-full min-h-screen md:min-h-0 md:h-[820px] grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-[#0d141f] rounded-none md:rounded-[32px] border-0 md:border md:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        {/* Narrative — desktop left / mobile bottom */}
        <aside className="order-2 md:order-1 md:col-span-7 lg:col-span-8 p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0a0f18] to-[#161d2a]">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10 md:mb-12">
              <img src={logoHyonVertical} alt="Hyon Tecnologia" className="h-14 w-auto drop-shadow-lg" />
            </div>

            <h1
              className="text-4xl lg:text-6xl text-white mb-6 leading-[1.05] max-w-xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Gestão empresarial{" "}
              <span className="text-teal-400 italic">360°</span> para o seu negócio B2B.
            </h1>
            <p className="text-gray-400 text-base lg:text-lg max-w-md mb-10 lg:mb-12">
              Acompanhe MRR, controle SLAs e automatize propostas em uma única plataforma integrada.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.title}
                    className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm hover:border-teal-500/30 hover:bg-white/[0.07] transition-all"
                  >
                    <Icon className="w-6 h-6 text-teal-400 mb-3" strokeWidth={1.5} />
                    <div className="text-white font-medium mb-1">{m.title}</div>
                    <div
                      className="text-gray-500 text-sm italic"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {m.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 mt-10 md:mt-12 pt-6 md:pt-8 border-t border-white/5 flex flex-wrap gap-x-8 gap-y-3 items-center opacity-70">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
              Integração nativa
            </span>
            <span className="text-sm text-white font-bold tracking-tight">ASAAS</span>
            <span className="text-sm text-white font-bold tracking-tight">Certificado A1</span>
            <span className="text-sm text-white font-bold tracking-tight">Portal Cliente</span>
          </div>
        </aside>

        {/* Login form — desktop right / mobile top */}
        <section className="order-1 md:order-2 md:col-span-5 lg:col-span-4 bg-[#0a0f18] p-8 md:p-10 lg:p-14 flex flex-col justify-center border-b md:border-b-0 md:border-l border-white/5 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-sm mx-auto w-full relative z-10">
            <div className="mb-10 text-center md:text-left">
              <h2
                className="text-3xl lg:text-4xl text-white mb-2"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Bem-vindo de volta
              </h2>
              <p className="text-gray-500">Acesse sua central de comando.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Esqueceu a senha?
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 checked:bg-teal-500 checked:border-teal-500 transition-all"
                  />
                  <svg
                    className="absolute h-3.5 w-3.5 pointer-events-none hidden peer-checked:block text-[#0a0f18] left-[3px]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={4}
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-400">Manter conectado</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-400 text-[#0a0f18] font-bold py-4 rounded-xl transition-all shadow-[0_10px_30px_rgba(20,184,166,0.2)] hover:shadow-[0_15px_40px_rgba(20,184,166,0.3)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar no Sistema
              </button>
            </form>

            <div className="mt-10 text-center md:text-left">
              <p className="text-sm text-gray-500">
                Acesso restrito.{" "}
                <span
                  className="text-white/80 italic"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Solicite credenciais ao administrador.
                </span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
