import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Rocket, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/hooks/use-toast";
import { TEMPLATES_IMPLANTACAO } from "@/lib/constants";

export default function Implantacao() {
  const { tarefas, clientes, addTarefa, getCliente, getTecnico, tecnicos, tecnicoAtualId } = useApp();
  const navigate = useNavigate();
  const [showNova, setShowNova] = useState(false);
  const [templateId, setTemplateId] = useState(TEMPLATES_IMPLANTACAO[0].id);
  const [clienteId, setClienteId] = useState("");
  const [responsavel, setResponsavel] = useState(tecnicoAtualId);

  // Get parent implantacao tasks (no implantacaoId means it IS a parent)
  const implantacoes = useMemo(() =>
    tarefas.filter(t => t.tipoOperacional === "implantacao" && !t.implantacaoId),
  [tarefas]);

  const getSubtarefas = (parentId: string) =>
    tarefas.filter(t => t.implantacaoId === parentId);

  const now = new Date();

  const handleCriarImplantacao = () => {
    if (!clienteId) { toast({ title: "Selecione um cliente", variant: "destructive" }); return; }
    const template = TEMPLATES_IMPLANTACAO.find(t => t.id === templateId);
    if (!template) return;

    const parentId = Math.random().toString(36).slice(2, 11);
    // Create parent
    addTarefa({
      titulo: `Implantação ${template.nome} - ${getCliente(clienteId)?.nome || ""}`,
      descricao: `Implantação baseada no template "${template.nome}"`,
      clienteId, responsavelId: responsavel, prioridade: "alta", status: "em_andamento",
      prazoDataHora: new Date(Date.now() + 30 * 86400000).toISOString(),
      tags: ["implantação", template.sistemaRelacionado], checklist: [], anexosFake: [], comentarios: [],
      tipoOperacional: "implantacao", sistemaRelacionado: template.sistemaRelacionado,
      etapaImplantacao: template.etapas[0].texto,
    });

    // We need to use a timeout to get the parent created first
    setTimeout(() => {
      const createdParent = tarefas.find(t => t.titulo.includes(template.nome) && t.titulo.includes(getCliente(clienteId)?.nome || "xxx"));
      // Create subtasks - use parentId pattern
      template.etapas.forEach((etapa, i) => {
        addTarefa({
          titulo: etapa.texto, descricao: "", clienteId,
          responsavelId: etapa.responsavelPadraoId, prioridade: "media", status: "a_fazer",
          tags: [], checklist: [], anexosFake: [], comentarios: [],
          tipoOperacional: "implantacao", sistemaRelacionado: template.sistemaRelacionado,
          implantacaoId: parentId,
        });
      });
    }, 100);

    toast({ title: "Implantação criada com subtarefas!" });
    setShowNova(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Rocket}
        iconClassName="text-violet-500"
        title="Implantações"
        actions={<Button size="sm" onClick={() => setShowNova(true)} className="gap-1.5"><Plus className="h-4 w-4" />Nova Implantação</Button>}
      />
      <ModuleNavGrid moduleId="operacional" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {implantacoes.map(imp => {
          const subs = getSubtarefas(imp.id);
          const concluidas = subs.filter(s => s.status === "concluida").length;
          const progress = subs.length > 0 ? Math.round((concluidas / subs.length) * 100) : 0;
          const isAtrasada = imp.prazoDataHora && new Date(imp.prazoDataHora) < now && imp.status !== "concluida";
          const cliente = getCliente(imp.clienteId);
          const responsavel = getTecnico(imp.responsavelId);

          return (
            <Card key={imp.id} className={`cursor-pointer hover:shadow-md transition-shadow ${isAtrasada ? "border-destructive/50" : ""}`} onClick={() => navigate(`/tarefas/${imp.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium leading-tight">{imp.titulo}</CardTitle>
                  {isAtrasada && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                  {imp.status === "concluida" && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {imp.sistemaRelacionado && <Badge variant="outline" className="text-[9px]">{imp.sistemaRelacionado.toUpperCase()}</Badge>}
                  {imp.etapaImplantacao && <Badge className="text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">{imp.etapaImplantacao}</Badge>}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{concluidas}/{subs.length} etapas</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{cliente?.nome || "—"}</span>
                  <span>{responsavel?.nome?.split(" ")[0]}</span>
                </div>
                {imp.prazoDataHora && (
                  <p className={`text-xs ${isAtrasada ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    Prazo: {new Date(imp.prazoDataHora).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {implantacoes.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon={Rocket} title="Nenhuma implantação em andamento" description="Crie uma nova implantação para começar" actionLabel="Nova Implantação" onAction={() => setShowNova(true)} />
          </div>
        )}
      </div>

      <Dialog open={showNova} onOpenChange={setShowNova}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Implantação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES_IMPLANTACAO.map(t => <SelectItem key={t.id} value={t.id}>{t.nome} ({t.sistemaRelacionado.toUpperCase()})</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="mt-2 space-y-1">
                {TEMPLATES_IMPLANTACAO.find(t => t.id === templateId)?.etapas.map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {e.texto}</p>
                ))}
              </div>
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável principal</Label>
              <Select value={responsavel} onValueChange={setResponsavel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{tecnicos.filter(t => t.ativo).map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNova(false)}>Cancelar</Button>
            <Button onClick={handleCriarImplantacao}>Criar Implantação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
