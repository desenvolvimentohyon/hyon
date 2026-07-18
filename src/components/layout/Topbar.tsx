import { Search, Plus, Bell, Moon, Sun, AlertTriangle, Clock, FileWarning, CreditCard, ChevronRight, LogOut, WifiOff, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useApp } from "@/contexts/AppContext";

import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { usePropostas } from "@/contexts/PropostasContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { findBreadcrumb } from "@/lib/sidebarModules";
import { VersionHistoryButton } from "./VersionHistoryButton";

interface Notificacao {
  id: string;
  tipo: "critico" | "alerta" | "info";
  categoria: "financeiro" | "proposta" | "tarefa";
  titulo: string;
  descricao: string;
  rota: string;
  icone: "atraso" | "proposta" | "tarefa" | "financeiro";
}

export function Topbar() {
  const { profile } = useAuth(); // Read early to avoid conditional hook rules if any
  const { tecnicos, tecnicoAtualId, setTecnicoAtual, tarefas, clientes } = useApp();
  
  const { signOut } = useAuth();
  const { titulos } = useFinanceiro();
  const { propostas } = usePropostas();
  const navigate = useNavigate();
  const location = useLocation();
  const [busca, setBusca] = useState("");
  const { theme, setTheme } = useTheme();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);


  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  // Breadcrumb
  const breadcrumb = useMemo(() => findBreadcrumb(location.pathname), [location.pathname]);

  const notificacoes = useMemo<Notificacao[]>(() => {
    const items: Notificacao[] = [];
    const hoje = new Date();

    // === FINANCEIRO: Títulos vencidos (a receber) ===
    if (titulos.length > 0) {
      const titulosVencidos = titulos.filter(t => {
        if (t.tipo !== "receber") return false;
        if (t.status === "pago" || t.status === "cancelado") return false;
        const venc = new Date(t.vencimento);
        const diffDias = Math.floor((hoje.getTime() - venc.getTime()) / 86400000);
        return diffDias > 30;
      });

      if (titulosVencidos.length > 0) {
        const valorTotal = titulosVencidos.reduce((s, t) => s + t.valorOriginal, 0);
        items.push({
          id: "fin-critico-30d",
          tipo: "critico",
          categoria: "financeiro",
          titulo: `${titulosVencidos.length} título(s) com atraso crítico`,
          descricao: `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} vencidos há +30 dias`,
          rota: "/financeiro/contas-a-receber",
          icone: "atraso",
        });
      }

      // Títulos vencendo em 7 dias
      const vencendo7d = titulos.filter(t => {
        if (t.tipo !== "receber") return false;
        if (t.status === "pago" || t.status === "cancelado") return false;
        const venc = new Date(t.vencimento);
        const diffDias = Math.floor((venc.getTime() - hoje.getTime()) / 86400000);
        return diffDias >= 0 && diffDias <= 7;
      });

      if (vencendo7d.length > 0) {
        const valorTotal = vencendo7d.reduce((s, t) => s + t.valorOriginal, 0);
        items.push({
          id: "fin-vencendo-7d",
          tipo: "alerta",
          categoria: "financeiro",
          titulo: `${vencendo7d.length} título(s) vencem em 7 dias`,
          descricao: `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} a receber`,
          rota: "/financeiro/contas-a-receber",
          icone: "financeiro",
        });
      }

      // Contas a pagar vencidas
      const pagarVencidas = titulos.filter(t => {
        if (t.tipo !== "pagar") return false;
        if (t.status === "pago" || t.status === "cancelado") return false;
        return new Date(t.vencimento) < hoje;
      });

      if (pagarVencidas.length > 0) {
        items.push({
          id: "fin-pagar-vencidas",
          tipo: "alerta",
          categoria: "financeiro",
          titulo: `${pagarVencidas.length} conta(s) a pagar vencida(s)`,
          descricao: `R$ ${pagarVencidas.reduce((s, t) => s + t.valorOriginal, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          rota: "/financeiro/contas-a-pagar",
          icone: "financeiro",
        });
      }
    }

    // === PROPOSTAS: Vencendo ou expiradas ===
    if (propostas.length > 0) {
      const propostasVencendo = propostas.filter(p => {
        if (p.statusAceite !== "pendente") return false;
        if (!p.dataValidade) return false;
        const validade = new Date(p.dataValidade);
        const diffDias = Math.floor((validade.getTime() - hoje.getTime()) / 86400000);
        return diffDias >= 0 && diffDias <= 3;
      });

      if (propostasVencendo.length > 0) {
        const desc = propostasVencendo.length > 1 
          ? propostasVencendo.map(p => p.numeroProposta).join(", ").slice(0, 50) + "..."
          : propostasVencendo[0].numeroProposta;
        items.push({
          id: "prop-vencendo",
          tipo: "critico",
          categoria: "proposta",
          titulo: `${propostasVencendo.length} proposta(s) vencendo`,
          descricao: desc,
          rota: "/propostas",
          icone: "proposta",
        });
      }

      const propostasExpiradas = propostas.filter(p => {
        if (p.statusAceite !== "pendente") return false;
        if (!p.dataValidade) return false;
        return new Date(p.dataValidade) < hoje;
      });

      if (propostasExpiradas.length > 0) {
        items.push({
          id: "prop-expiradas",
          tipo: "alerta",
          categoria: "proposta",
          titulo: `${propostasExpiradas.length} proposta(s) expirada(s)`,
          descricao: "Validade ultrapassada sem aceite",
          rota: "/propostas",
          icone: "proposta",
        });
      }
    }

    // === TAREFAS: Atrasadas ===
    if (tarefas.length > 0) {
      const tarefasAtrasadas = tarefas.filter(t => {
        if (!t.prazoDataHora) return false;
        if (t.status === "concluida" || t.status === "cancelada") return false;
        return new Date(t.prazoDataHora) < hoje;
      });

      if (tarefasAtrasadas.length > 0) {
        items.push({
          id: "tarefas-atrasadas",
          tipo: "alerta",
          categoria: "tarefa",
          titulo: `${tarefasAtrasadas.length} tarefa(s) atrasada(s)`,
          descricao: "Prazo ultrapassado",
          rota: "/tarefas?filtro=atrasadas",
          icone: "tarefa",
        });
      }
    }

    return items;
  }, [titulos.length, propostas.length, tarefas.length]);

  const totalNotificacoes = notificacoes.length;
  const temCritico = notificacoes.some(n => n.tipo === "critico");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (busca.trim()) {
      navigate(`/tarefas?busca=${encodeURIComponent(busca.trim())}`);
      setBusca("");
    }
  };

  const handleNotificacaoClick = (n: Notificacao) => {
    setPopoverOpen(false);
    navigate(n.rota);
  };

  const getIcone = (icone: string) => {
    switch (icone) {
      case "atraso": return <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
      case "proposta": return <FileWarning className="h-4 w-4 text-warning shrink-0" />;
      case "tarefa": return <Clock className="h-4 w-4 text-warning shrink-0" />;
      case "financeiro": return <CreditCard className="h-4 w-4 text-info shrink-0" />;
      default: return <Bell className="h-4 w-4 shrink-0" />;
    }
  };

  const getTipoBadge = (tipo: Notificacao["tipo"]) => {
    switch (tipo) {
      case "critico": return "bg-destructive/10 text-destructive border-destructive/20";
      case "alerta": return "bg-warning/10 text-warning border-warning/20";
      case "info": return "bg-info/10 text-info border-info/20";
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 sm:gap-3 bg-background/75 backdrop-blur-xl px-2 sm:px-4" style={{ borderBottom: "1px solid hsl(var(--border) / 0.6)" }}>
      <SidebarTrigger className="shrink-0" />

      {/* Breadcrumb — desktop only */}
      {breadcrumb && (
        <Breadcrumb className="hidden md:flex min-w-0 max-w-[40%]">
          <BreadcrumbList className="gap-1.5 text-[12px]">
            <BreadcrumbItem className="text-muted-foreground/70">
              <BreadcrumbLink asChild>
                <Link to={breadcrumb.parent.children[0]?.url || "/"} className="hover:text-foreground transition-colors truncate max-w-[160px] inline-block">
                  {breadcrumb.parent.title}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/30" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-foreground/85 font-medium truncate max-w-[220px]">
                {breadcrumb.child.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}


      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 min-w-0 max-w-md ml-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Buscar tarefas, clientes..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 pr-3 h-9 text-[13px] bg-muted/50 border border-transparent rounded-lg placeholder:text-muted-foreground/50 focus-visible:bg-background focus-visible:border-border focus-visible:ring-2 focus-visible:ring-primary/15 transition-all"
          />
        </div>
      </form>
      <div className="flex-1 sm:hidden" />


      <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
        {/* Online/Offline indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 text-destructive mr-1">
            <WifiOff className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium hidden sm:inline">Offline</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <VersionHistoryButton />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => window.open("/landing", "_blank")}
          title="Landing Page"
        >
          <Globe className="h-4 w-4" />
        </Button>

        {/* Notification Center */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`relative h-9 w-9 rounded-lg ${temCritico ? "text-destructive hover:text-destructive" : totalNotificacoes > 0 ? "text-warning hover:text-warning" : ""}`}
            >
              <Bell className="h-4 w-4" />
              {totalNotificacoes > 0 && (
                <Badge className={`absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px] rounded-full ${temCritico ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>
                  {totalNotificacoes}
                </Badge>
              )}
              {temCritico && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive animate-ping opacity-30" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-1rem)] sm:w-96 p-0 rounded-xl shadow-elevated" align="end" sideOffset={8}>
            <div className="px-4 py-3 border-b">
              <h4 className="font-semibold text-sm">Notificações</h4>
              <p className="text-xs text-muted-foreground">
                {totalNotificacoes === 0 ? "Nenhum alerta no momento" : `${totalNotificacoes} alerta(s) ativo(s)`}
              </p>
            </div>
            <ScrollArea className="max-h-80">
              {notificacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Tudo em ordem! ✓</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notificacoes.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificacaoClick(n)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="mt-0.5">{getIcone(n.icone)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium truncate">{n.titulo}</span>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 rounded-full ${getTipoBadge(n.tipo)}`}>
                            {n.tipo === "critico" ? "CRÍTICO" : n.tipo === "alerta" ? "ALERTA" : "INFO"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{n.descricao}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button size="sm" onClick={() => navigate("/tarefas?nova=1")} className="gap-1.5 rounded-lg shadow-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
          onClick={() => signOut()}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
