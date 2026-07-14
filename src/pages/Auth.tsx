import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logoHyonVertical from "@/assets/logo-hyon-vertical.png";

export default function Auth() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f18] selection:bg-teal-500/30 font-sans">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md px-6 py-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoHyonVertical} alt="Hyon Tecnologia" className="h-20 w-auto drop-shadow-lg" />
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-6 sm:p-8 rounded-3xl shadow-2xl">
          <header className="mb-8">
            <h1
              className="text-3xl sm:text-4xl text-white font-normal mb-2 tracking-tight"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Entrar na plataforma
            </h1>
            <p className="text-slate-400 text-sm">
              Bem-vindo de volta. Acesse sua plataforma de gestão.
            </p>
          </header>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1 block">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Esqueci minha senha
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
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all placeholder:text-slate-600"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-auto bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all border-0"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs">
              Acesso restrito. Solicite credenciais ao administrador da sua organização.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center gap-6 text-slate-600 text-xs">
          <span>© {new Date().getFullYear()} Hyon Tecnologia</span>
        </div>
      </div>
    </div>
  );
}
