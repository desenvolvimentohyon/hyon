import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { StatusTarefa, Prioridade, STATUS_ORDER } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Play, Pause, Plus, Clock, MessageSquare, History, FileText, CheckSquare, Trash2, ImagePlus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function TarefaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tarefas, updateTarefa, deleteTarefa, startTimer, stopTimer, clientes, tecnicos, getCliente, getTecnico, getStatusLabel, getPrioridadeLabel, tecnicoAtualId } = useApp();
  const tarefa = tarefas.find(t => t.id === id);

  const [editTitulo, setEditTitulo] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [novoCheckItem, setNovoCheckItem] = useState("");
  const [novoComentario, setNovoComentario] = useState("");
  const [timerDisplay, setTimerDisplay] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const [editObservacoes, setEditObservacoes] = useState(false);
  const [observacoesText, setObservacoesText] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  useEffect(() => {
    if (!tarefa) return;
    setTitulo(tarefa.titulo);
  }, [tarefa?.titulo]);

  // Live timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (tarefa?.timerRodando && tarefa.timerInicioTimestamp) {
      const update = () => {
        const elapsed = Math.floor((Date.now() - tarefa.timerInicioTimestamp!) / 1000);
        setTimerDisplay(tarefa.tempoTotalSegundos + elapsed);
      };
      update();
      intervalRef.current = setInterval(update, 1000);
    } else if (tarefa) {
      setTimerDisplay(tarefa.tempoTotalSegundos);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tarefa?.timerRodando, tarefa?.timerInicioTimestamp, tarefa?.tempoTotalSegundos]);

  if (!tarefa) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Tarefa não encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/tarefas")}>Voltar</Button>
      </div>
    );
  }

  const handleSaveTitulo = () => {
    if (titulo.trim() && titulo !== tarefa.titulo) {
      updateTarefa(tarefa.id, { titulo: titulo.trim() }, `Título alterado para "${titulo.trim()}"`);
      toast({ title: "Título atualizado" });
    }
    setEditTitulo(false);
  };

  const handleStatusChange = (s: StatusTarefa) => {
    updateTarefa(tarefa.id, { status: s }, `Status: ${getStatusLabel(tarefa.status)} → ${getStatusLabel(s)}`);
    toast({ title: `Status: ${getStatusLabel(s)}` });
  };

  const handlePrioridadeChange = (p: Prioridade) => {
    updateTarefa(tarefa.id, { prioridade: p }, `Prioridade: ${getPrioridadeLabel(p)}`);
  };

  const handleResponsavelChange = (r: string) => {
    updateTarefa(tarefa.id, { responsavelId: r }, `Responsável: ${getTecnico(r)?.nome}`);
  };

  const addCheckItem = () => {
    if (!novoCheckItem.trim()) return;
    const newChecklist = [...tarefa.checklist, { id: Math.random().toString(36).slice(2), texto: novoCheckItem.trim(), concluido: false }];
    updateTarefa(tarefa.id, { checklist: newChecklist });
    setNovoCheckItem("");
  };

  const toggleCheckItem = (itemId: string) => {
    const newChecklist = tarefa.checklist.map(c => c.id === itemId ? { ...c, concluido: !c.concluido } : c);
    updateTarefa(tarefa.id, { checklist: newChecklist });
  };

  const removeCheckItem = (itemId: string) => {
    updateTarefa(tarefa.id, { checklist: tarefa.checklist.filter(c => c.id !== itemId) });
  };

  const addComentario = () => {
    if (!novoComentario.trim()) return;
    const tecnico = getTecnico(tecnicoAtualId);
    const newComentarios = [...tarefa.comentarios, {
      id: Math.random().toString(36).slice(2),
      autorNome: tecnico?.nome || "Desconhecido",
      texto: novoComentario.trim(),
      criadoEm: new Date().toISOString(),
    }];
    updateTarefa(tarefa.id, { comentarios: newComentarios }, "Comentário adicionado");
    setNovoComentario("");
    toast({ title: "Comentário adicionado" });
  };

  const checklistProgress = tarefa.checklist.length > 0
    ? Math.round((tarefa.checklist.filter(c => c.concluido).length / tarefa.checklist.length) * 100)
    : 0;

  const now = new Date();
  const isAtrasada = tarefa.prazoDataHora && tarefa.status !== "concluida" && tarefa.status !== "cancelada" && new Date(tarefa.prazoDataHora) < now;

  return (
    <div className="space-y-4 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/tarefas")} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {editTitulo ? (
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} onBlur={handleSaveTitulo} onKeyDown={e => e.key === "Enter" && handleSaveTitulo()} autoFocus className="text-xl font-bold" />
          ) : (
            <h1 className="text-xl font-bold cursor-pointer hover:text-primary transition-colors flex-1" onClick={() => setEditTitulo(true)}>
              {tarefa.titulo}
              {isAtrasada && <Badge variant="destructive" className="ml-2 text-[10px]">Atrasada</Badge>}
            </h1>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Select value={tarefa.status} onValueChange={v => handleStatusChange(v as StatusTarefa)}>
            <SelectTrigger className="w-[180px] h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={tarefa.prioridade} onValueChange={v => handlePrioridadeChange(v as Prioridade)}>
            <SelectTrigger className="w-[130px] h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{(["baixa","media","alta","urgente"] as Prioridade[]).map(p => <SelectItem key={p} value={p}>{getPrioridadeLabel(p)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={tarefa.responsavelId} onValueChange={handleResponsavelChange}>
            <SelectTrigger className="w-[150px] h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{tecnicos.filter(t => t.ativo).map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">{tarefa.clienteId ? getCliente(tarefa.clienteId)?.nome : "Tarefa Avulsa"}</Badge>
          {tarefa.prazoDataHora && (
            <Badge variant="outline" className="text-xs">
              Prazo: {new Date(tarefa.prazoDataHora).toLocaleString("pt-BR")}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Resumo</TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1.5"><CheckSquare className="h-3.5 w-3.5" />Checklist</TabsTrigger>
          <TabsTrigger value="tempo" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Tempo</TabsTrigger>
          <TabsTrigger value="comentarios" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Comentários</TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5"><History className="h-3.5 w-3.5" />Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Descrição</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{tarefa.descricao || "Sem descrição"}</p></CardContent>
          </Card>
          {tarefa.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {tarefa.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
            </div>
          )}
          {tarefa.anexosFake.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Anexos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {tarefa.anexosFake.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{a.nomeArquivo}</span>
                    <span className="text-muted-foreground text-xs">({a.tamanho})</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <div className="pt-2">
            <Button variant="destructive" size="sm" onClick={() => { deleteTarefa(tarefa.id); navigate("/tarefas"); toast({ title: "Tarefa excluída" }); }}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />Excluir Tarefa
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4 mt-4">
          {tarefa.checklist.length > 0 && (
            <div className="flex items-center gap-3">
              <Progress value={checklistProgress} className="flex-1" />
              <span className="text-sm font-medium">{checklistProgress}%</span>
            </div>
          )}
          <div className="space-y-2">
            {tarefa.checklist.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group">
                <Checkbox checked={item.concluido} onCheckedChange={() => toggleCheckItem(item.id)} />
                <span className={`flex-1 text-sm ${item.concluido ? "line-through text-muted-foreground" : ""}`}>{item.texto}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeCheckItem(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={novoCheckItem} onChange={e => setNovoCheckItem(e.target.value)} placeholder="Novo item..." onKeyDown={e => e.key === "Enter" && addCheckItem()} className="h-9" />
            <Button size="sm" onClick={addCheckItem}><Plus className="h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="tempo" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <div className="text-5xl font-mono font-bold tracking-wider tabular-nums">{formatTime(timerDisplay)}</div>
              <div className="flex gap-3">
                {tarefa.timerRodando ? (
                  <Button onClick={() => { stopTimer(tarefa.id); toast({ title: "Timer pausado" }); }} variant="destructive" className="gap-1.5">
                    <Pause className="h-4 w-4" />Pausar
                  </Button>
                ) : (
                  <Button onClick={() => { startTimer(tarefa.id); toast({ title: "Timer iniciado" }); }} className="gap-1.5">
                    <Play className="h-4 w-4" />Iniciar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Total acumulado: {formatTime(tarefa.tempoTotalSegundos)}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comentarios" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Textarea value={novoComentario} onChange={e => setNovoComentario(e.target.value)} placeholder="Escreva um comentário..." rows={2} className="flex-1" />
            <Button onClick={addComentario} className="self-end">Enviar</Button>
          </div>
          <div className="space-y-3">
            {tarefa.comentarios.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum comentário ainda</p>}
            {[...tarefa.comentarios].reverse().map(c => (
              <div key={c.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{c.autorNome}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.criadoEm).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.texto}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <div className="space-y-1">
            {tarefa.historico.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro</p>}
            {[...tarefa.historico].reverse().map(h => (
              <div key={h.id} className="flex gap-3 p-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{h.acao}</p>
                  {h.detalhes && <p className="text-xs text-muted-foreground">{h.detalhes}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(h.criadoEm).toLocaleString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
