import { Search, Plus, Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "next-themes";

export function Topbar() {
  const { tecnicos, tecnicoAtualId, setTecnicoAtual, tarefas } = useApp();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const { theme, setTheme } = useTheme();

  const atrasadas = tarefas.filter(t => {
    if (!t.prazoDataHora) return false;
    if (t.status === "concluida" || t.status === "cancelada") return false;
    return new Date(t.prazoDataHora) < new Date();
  }).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (busca.trim()) {
      navigate(`/tarefas?busca=${encodeURIComponent(busca.trim())}`);
      setBusca("");
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4">
      <SidebarTrigger className="shrink-0" />

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-0"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {atrasadas > 0 && (
          <Button variant="ghost" size="sm" className="relative text-destructive hover:text-destructive" onClick={() => navigate("/tarefas?filtro=atrasadas")}>
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
              {atrasadas}
            </Badge>
          </Button>
        )}

        <Select value={tecnicoAtualId} onValueChange={setTecnicoAtual}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Técnico" />
          </SelectTrigger>
          <SelectContent>
            {tecnicos.filter(t => t.ativo).map(t => (
              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={() => navigate("/tarefas?nova=1")} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </Button>
      </div>
    </header>
  );
}
