import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A] p-4 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full glass-premium border border-white/5 p-8 text-center space-y-8 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto relative group">
            <Search className="w-16 h-16 text-primary animate-pulse group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-2 -right-2 bg-destructive text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
              404
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto">
            Não conseguimos encontrar o caminho <code className="px-1.5 py-0.5 rounded bg-white/5 text-primary text-xs font-mono">{location.pathname}</code>.
            Ele pode ter sido movido ou excluído.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="border-white/10 hover:bg-white/5 transition-all gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button 
            onClick={() => navigate("/")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all gap-2"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </div>

        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium">
            Hyon Platform v2.1.8
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;