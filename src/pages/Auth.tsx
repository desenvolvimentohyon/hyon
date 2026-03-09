import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { lovable } from "@/integrations/lovable/index";
import logoHyon from "@/assets/logo-hyon.png";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    } else {
      if (!fullName.trim()) {
        toast({ title: "Nome obrigatório", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
      }
    }
    setLoading(false);
  };

  return (
    <>
      {/* Inline keyframes for floating orbs */}
      <style>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.08); }
          66% { transform: translate(25px, -15px) scale(0.92); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, 25px) scale(0.96); }
          66% { transform: translate(-30px, -35px) scale(1.04); }
        }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 60%), #030712",
        }}
      >
        {/* Floating orbs - hidden on mobile */}
        <div
          className="hidden md:block absolute w-[500px] h-[500px] rounded-full opacity-[0.15] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)",
            top: "-10%",
            left: "-5%",
            filter: "blur(120px)",
            animation: "float-orb-1 12s ease-in-out infinite",
          }}
        />
        <div
          className="hidden md:block absolute w-[400px] h-[400px] rounded-full opacity-[0.12] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.6) 0%, transparent 70%)",
            bottom: "-8%",
            right: "-3%",
            filter: "blur(120px)",
            animation: "float-orb-2 15s ease-in-out infinite",
          }}
        />
        <div
          className="hidden md:block absolute w-[350px] h-[350px] rounded-full opacity-[0.1] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)",
            top: "40%",
            right: "20%",
            filter: "blur(120px)",
            animation: "float-orb-3 10s ease-in-out infinite",
          }}
        />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Glass Card */}
        <div
          className="w-full max-w-md rounded-2xl relative z-10"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(24px) saturate(1.2)",
            WebkitBackdropFilter: "blur(24px) saturate(1.2)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Header */}
          <div className="text-center pt-8 pb-2 px-8">
            <div className="flex justify-center mb-6">
              <img src={logoHyon} alt="Hyon Tech" className="h-24 w-auto drop-shadow-lg" />
            </div>
            <h1 className="text-2xl font-bold text-white">{isLogin ? "Entrar na plataforma" : "Criar Conta"}</h1>
            <p className="text-sm text-white/50 mt-1">
              {isLogin ? "Acesse sua plataforma de gestão" : "Crie sua conta para começar"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 px-8 pt-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-medium uppercase tracking-wide text-white/40">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      required={!isLogin}
                      className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:border-blue-500/50 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition-all duration-150"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-white/40">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:border-blue-500/50 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition-all duration-150"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-white/40">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:border-blue-500/50 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition-all duration-150"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 px-8 pt-6 pb-8">
              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-0 shadow-lg shadow-blue-600/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-150"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Entrar" : "Criar Conta"}
              </Button>


              <Button
                type="button"
                variant="link"
                className="text-sm text-white/40 hover:text-white/70 transition-colors duration-150"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
