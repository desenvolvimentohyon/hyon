
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Plus, Calendar } from "lucide-react";
import { useParametros } from "@/contexts/ParametrosContext";
import { useReceita } from "@/contexts/ReceitaContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Goal {
  id: string;
  system_id: string | null;
  target_value: number;
  category: string;
  target_date: string;
}

export function GrowthGoals() {
  const { sistemas } = useParametros();
  const { clientesReceita } = useReceita();
  
  // Estado para gerenciar o formulário
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    system_id: "global",
    category: "mrr",
    target_value: "",
    target_date: ""
  });

  // Estado mockado enquanto a tabela growth_goals é criada
  const [goals, setGoals] = useState([
    { id: '1', system_id: sistemas[0]?.id || '1', target_value: 50000, category: 'mrr', target_date: '2026-12-31' },
    { id: '2', system_id: null, target_value: 100, category: 'ativos', target_date: '2026-12-31' }
  ]);

  const calculateProgress = (goal: any) => {
    let current = 0;
    if (goal.category === 'mrr') {
      current = clientesReceita
        .filter(c => c.mensalidadeAtiva && (!goal.system_id || c.sistemaPrincipal === sistemas.find(s => s.id === goal.system_id)?.nome))
        .reduce((s, c) => s + c.valorMensalidade, 0);
    } else {
      current = clientesReceita
        .filter(c => c.statusCliente === 'ativo' && (!goal.system_id || c.sistemaPrincipal === sistemas.find(s => s.id === goal.system_id)?.nome))
        .length;
    }
    
    const pct = Math.min(Math.round((current / goal.target_value) * 100), 100);
    return { current, pct };
  };

  const handleSaveGoal = async () => {
    if (!formData.target_value || !formData.target_date) {
      toast.error("Por favor, preencha o valor alvo e a data limite.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulação de delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newGoal = {
        id: Math.random().toString(36).substr(2, 9),
        system_id: formData.system_id === "global" ? null : formData.system_id,
        category: formData.category,
        target_value: Number(formData.target_value),
        target_date: formData.target_date
      };

      setGoals(prev => [newGoal, ...prev]);
      toast.success("Meta configurada com sucesso!");
      
      // Reset form
      setFormData({
        system_id: "global",
        category: "mrr",
        target_value: "",
        target_date: ""
      });
    } catch (error) {
      toast.error("Erro ao salvar meta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Metas de Crescimento</h2>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Definir Nova Meta</DialogTitle>
              <DialogDescription>Acompanhe o crescimento por sistema ou global.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Sistema (opcional)</Label>
                <Select 
                  value={formData.system_id} 
                  onValueChange={(v) => setFormData(f => ({ ...f, system_id: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (Todos)</SelectItem>
                    {sistemas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mrr">MRR (Recorrência)</SelectItem>
                    <SelectItem value="ativos">Quantidade de Clientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Valor Alvo</Label>
                <Input 
                  type="number" 
                  placeholder={formData.category === 'mrr' ? "Ex: 50000" : "Ex: 100"} 
                  value={formData.target_value}
                  onChange={(e) => setFormData(f => ({ ...f, target_value: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data Limite</Label>
                <Input 
                  type="date" 
                  value={formData.target_date}
                  onChange={(e) => setFormData(f => ({ ...f, target_date: e.target.value }))}
                />
              </div>
              <Button 
                onClick={handleSaveGoal} 
                className="mt-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar Meta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {goals.map(goal => {
          const { current, pct } = calculateProgress(goal);
          const system = sistemas.find(s => s.id === goal.system_id);
          
          return (
            <Card key={goal.id} className="neon-border-subtle bg-card/50 backdrop-blur-sm overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
                      {goal.category === 'mrr' ? 'Meta de MRR' : 'Meta de Clientes'}
                      {system ? <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded">{system.nome}</span> : <span className="text-[10px] bg-muted px-1.5 rounded">Global</span>}
                    </CardTitle>
                    <CardDescription className="text-[10px] flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" /> Limite: {new Date(goal.target_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setFormData({
                            system_id: goal.system_id || "global",
                            category: goal.category,
                            target_value: goal.target_value.toString(),
                            target_date: goal.target_date
                          })}
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Meta</DialogTitle>
                          <DialogDescription>Ajuste os parâmetros da meta selecionada.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label>Sistema (opcional)</Label>
                            <Select 
                              value={formData.system_id} 
                              onValueChange={(v) => setFormData(f => ({ ...f, system_id: v }))}
                            >
                              <SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="global">Global (Todos)</SelectItem>
                                {sistemas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Select 
                              value={formData.category} 
                              onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mrr">MRR (Recorrência)</SelectItem>
                                <SelectItem value="ativos">Quantidade de Clientes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Valor Alvo</Label>
                            <Input 
                              type="number" 
                              value={formData.target_value}
                              onChange={(e) => setFormData(f => ({ ...f, target_value: e.target.value }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Data Limite</Label>
                            <Input 
                              type="date" 
                              value={formData.target_date}
                              onChange={(e) => setFormData(f => ({ ...f, target_date: e.target.value }))}
                            />
                          </div>
                          <Button 
                            onClick={async () => {
                              setIsSubmitting(true);
                              await new Promise(r => setTimeout(r, 600));
                              setGoals(prev => prev.map(g => g.id === goal.id ? {
                                ...g,
                                system_id: formData.system_id === "global" ? null : formData.system_id,
                                category: formData.category,
                                target_value: Number(formData.target_value),
                                target_date: formData.target_date
                              } : g));
                              setIsSubmitting(false);
                              toast.success("Meta atualizada!");
                            }} 
                            disabled={isSubmitting}
                          >
                            Salvar Alterações
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <div className="text-right">
                      <span className="text-2xl font-black text-primary">{pct}%</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider">
                    <div className="text-muted-foreground">
                      Atual: <span className="text-foreground">{goal.category === 'mrr' ? fmt(current) : current}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Alvo: <span className="text-foreground">{goal.category === 'mrr' ? fmt(goal.target_value) : goal.target_value}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
