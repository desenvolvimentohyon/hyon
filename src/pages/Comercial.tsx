import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { StatusComercial, STATUS_COMERCIAL_ORDER, STATUS_COMERCIAL_LABELS } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, TrendingUp, DollarSign, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { toast } from "@/hooks/use-toast";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";
import { useParametros } from "@/contexts/ParametrosContext";

export default function Comercial() {
  const { tarefas, addTarefa, updateTarefa, addCliente, tecnicos, tecnicoAtualId } = useApp();
  const { sistemas } = useParametros();
  const sistemasAtivos = sistemas.filter(s => s.ativo);
  const navigate = useNavigate();
  const [showNovoLead, setShowNovoLead] = useState(false);

  // Form state
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorProposta, setValorProposta] = useState("");
  const [tipoPlano, setTipoPlano] = useState("Básico");
  const [origemLead, setOrigemLead] = useState("Indicação");
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [sistemaRel, setSistemaRel] = useState(sistemasAtivos[0]?.nome || "");
  const [responsavel, setResponsavel] = useState(tecnicoAtualId);

  const comerciais = useMemo(() =>
    tarefas.filter(t => t.tipoOperacional === "comercial"),
  [tarefas]);

  const statusColors: Record<StatusComercial, string> = {
    lead: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    proposta_enviada: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    em_negociacao: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    fechado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    perdido: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };

  const handleCriarLead = () => {
    if (!titulo.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    addTarefa({
      titulo: titulo.trim(), descricao, clienteId: null, responsavelId: responsavel,
      prioridade: "media", status: "em_andamento", tags: ["lead"],
      checklist: [], anexosFake: [], comentarios: [],
      tipoOperacional: "comercial", sistemaRelacionado: sistemaRel, statusComercial: "lead",
      valorProposta: Number(valorProposta) || 0, tipoPlano, origemLead,
      dataPrevisaoFechamento: dataPrevisao || undefined,
    });
    toast({ title: "Lead criado com sucesso!" });
    setShowNovoLead(false);
    setTitulo(""); setDescricao(""); setValorProposta("");
  };

  const handleStatusChange = (tarefaId: string, novoStatus: StatusComercial) => {
    updateTarefa(tarefaId, { statusComercial: novoStatus }, `Pipeline: ${STATUS_COMERCIAL_LABELS[novoStatus]}`);
    toast({ title: `Status: ${STATUS_COMERCIAL_LABELS[novoStatus]}` });
  };

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent, status: StatusComercial) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id) {
      const tarefa = comerciais.find(t => t.id === id);
      if (tarefa && tarefa.statusComercial !== status) {
        handleStatusChange(id, status);
      }
    }
    setDragId(null);
    setDragOver(null);
  };

  const handleConverter = (tarefaId: string) => {
    const tarefa = tarefas.find(t => t.id === tarefaId);
    if (!tarefa) return;
    // Create client
    const clienteNome = tarefa.titulo.replace(/^(Lead|Proposta|Negociação|Fechado|Perdido)\s*-?\s*/i, "").trim();
    addCliente({
      nome: clienteNome, sistemaUsado: tarefa.sistemaRelacionado || "",
      tipoNegocio: "Novo cliente", perfilCliente: "estrategico",
      mensalidadeAtual: tarefa.valorProposta || 0, statusFinanceiro: "em_dia",
    });
    updateTarefa(tarefaId, { statusComercial: "fechado", status: "concluida" }, "Venda fechada e cliente convertido");
    toast({ title: "Cliente criado e venda fechada! 🎉" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        iconClassName="text-indigo-600"
        title="Pipeline Comercial"
        actions={<Button size="sm" onClick={() => setShowNovoLead(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo Lead</Button>}
      />
      <ModuleNavGrid moduleId="comercial" />

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COMERCIAL_ORDER.map(status => {
          const columnTasks = comerciais.filter(t => t.statusComercial === status);
          return (
            <div
              key={status}
              className={`flex-shrink-0 w-[280px] rounded-lg p-2 transition-colors ${dragOver === status ? "bg-accent/50 ring-2 ring-primary/30" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(status); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, status)}
            >
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`text-xs ${statusColors[status]}`}>{STATUS_COMERCIAL_LABELS[status]}</Badge>
                <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {columnTasks.map(t => (
                  <Card
                    key={t.id}
                    draggable
                    onDragStart={e => { setDragId(t.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", t.id); }}
                    onDragEnd={() => { setDragId(null); setDragOver(null); }}
                    className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${dragId === t.id ? "opacity-50 scale-95" : ""}`}
                  >
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium leading-tight cursor-pointer hover:underline" onClick={() => navigate(`/tarefas/${t.id}`)}>{t.titulo}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.sistemaRelacionado && <Badge variant="outline" className="text-[9px]">{t.sistemaRelacionado.toUpperCase()}</Badge>}
                        {t.tipoPlano && <Badge variant="outline" className="text-[9px]">{t.tipoPlano}</Badge>}
                      </div>
                      {t.valorProposta && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>R$ {t.valorProposta.toLocaleString("pt-BR")}/mês</span>
                        </div>
                      )}
                      <div className="flex gap-1">
                        {status !== "fechado" && status !== "perdido" && (
                          <Select value={status} onValueChange={v => handleStatusChange(t.id, v as StatusComercial)}>
                            <SelectTrigger className="h-6 text-[10px] w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUS_COMERCIAL_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_COMERCIAL_LABELS[s]}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        {status === "em_negociacao" && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 shrink-0" onClick={() => handleConverter(t.id)}>
                            <UserPlus className="h-3 w-3" />Converter
                          </Button>
                        )}
                      </div>
                      {t.motivoPerda && <p className="text-[10px] text-destructive">Motivo: {t.motivoPerda}</p>}
                      {t.objecoes && <p className="text-[10px] text-muted-foreground">Objeção: {t.objecoes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Novo Lead */}
      <Dialog open={showNovoLead} onOpenChange={setShowNovoLead}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Lead - Nome da Empresa" /></div>
            <div><Label>Descrição</Label><Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sistema</Label>
                <Select value={sistemaRel} onValueChange={v => {
                  setSistemaRel(v);
                  const sys = sistemas.find(s => s.nome === v);
                  if (sys && sys.valorVenda > 0 && !valorProposta) setValorProposta(String(sys.valorVenda));
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
                  <SelectContent>
                    {sistemasAtivos.map(s => (
                      <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor proposta (R$/mês)</Label><CurrencyInput value={Number(valorProposta) || 0} onValueChange={v => setValorProposta(String(v))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plano</Label>
                <Select value={tipoPlano} onValueChange={setTipoPlano}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Básico">Básico</SelectItem>
                    <SelectItem value="Completo">Completo</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Origem</Label>
                <Select value={origemLead} onValueChange={setOrigemLead}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="Redes Sociais">Redes Sociais</SelectItem>
                    <SelectItem value="Evento">Evento</SelectItem>
                    <SelectItem value="Prospecção">Prospecção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Previsão fechamento</Label><Input type="date" value={dataPrevisao} onChange={e => setDataPrevisao(e.target.value)} /></div>
              <div>
                <Label>Responsável</Label>
                <Select value={responsavel} onValueChange={setResponsavel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tecnicos.filter(t => t.ativo).map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoLead(false)}>Cancelar</Button>
            <Button onClick={handleCriarLead}>Criar Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
