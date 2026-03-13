import { useState, useMemo } from "react";
import { usePropostas } from "@/contexts/PropostasContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_VISUALIZACAO_LABELS, STATUS_ACEITE_LABELS } from "@/types/propostas";
import { PageHeader } from "@/components/ui/page-header";
import { Kanban } from "lucide-react";

export default function CRM() {
  const { propostas, crmConfig, loading, updateProposta } = usePropostas();
  const navigate = useNavigate();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const now = new Date();

  const isExpirada = (p: { dataValidade: string | null; statusAceite: string }) => {
    if (!p.dataValidade || p.statusAceite === "aceitou") return false;
    return new Date(p.dataValidade) < now;
  };

  const columns = useMemo(() => {
    return crmConfig.statusKanban.map(status => ({
      status,
      propostas: propostas.filter(p => p.statusCRM === status),
    }));
  }, [propostas, crmConfig.statusKanban]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDragId(id);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOver(status);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      const p = propostas.find(x => x.id === id);
      if (p && p.statusCRM !== newStatus) {
        updateProposta(id, { statusCRM: newStatus }, `Status CRM: ${p.statusCRM} → ${newStatus}`);
      }
    }
    setDragId(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOver(null);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-[500px]" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Kanban}
        iconClassName="text-indigo-600"
        title="CRM — Pipeline de Propostas"
        actions={<Badge variant="outline" className="text-xs">{propostas.length} propostas</Badge>}
      />

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {columns.map(col => (
          <div
            key={col.status}
            className={`flex-shrink-0 w-[280px] rounded-lg border transition-all ${dragOver === col.status ? "bg-accent/50 ring-2 ring-primary" : "bg-muted/30"}`}
            onDragOver={e => handleDragOver(e, col.status)}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, col.status)}
          >
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{col.status}</h3>
                <Badge variant="secondary" className="text-[10px]">{col.propostas.length}</Badge>
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[100px]">
              {col.propostas.map(p => (
                <Card
                  key={p.id}
                  draggable
                  onDragStart={e => handleDragStart(e, p.id)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${dragId === p.id ? "opacity-50 scale-95" : ""}`}
                  onClick={() => navigate(`/propostas/${p.id}`)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground">{p.numeroProposta}</span>
                      <Badge variant="outline" className="text-[9px]">{p.sistema}</Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{p.clienteNomeSnapshot || <span className="italic text-muted-foreground">Sem cliente</span>}</p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div><span className="text-muted-foreground">Mensal:</span> <span className="font-medium">R$ {p.valorMensalidade.toFixed(0)}</span></div>
                      <div><span className="text-muted-foreground">Impl:</span> <span className="font-medium">R$ {p.valorImplantacao.toFixed(0)}</span></div>
                    </div>
                    {p.dataEnvio && <div className="text-[10px] text-muted-foreground">Enviada: {new Date(p.dataEnvio).toLocaleDateString("pt-BR")}</div>}
                    <div className="flex flex-wrap gap-1">
                      <Badge className={`text-[9px] ${p.statusVisualizacao === "visualizado" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : p.statusVisualizacao === "nao_abriu" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" : "bg-muted text-muted-foreground"}`}>
                        {STATUS_VISUALIZACAO_LABELS[p.statusVisualizacao]}
                      </Badge>
                      <Badge className={`text-[9px] ${p.statusAceite === "aceitou" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : p.statusAceite === "recusou" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>
                        {STATUS_ACEITE_LABELS[p.statusAceite]}
                      </Badge>
                      {isExpirada(p) && <Badge variant="destructive" className="text-[9px]">Expirada</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
