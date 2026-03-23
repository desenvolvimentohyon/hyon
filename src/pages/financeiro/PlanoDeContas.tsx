import { useState, useMemo } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, ChevronRight, ChevronDown, Edit, Trash2, Download, Upload, FolderTree } from "lucide-react";
import { PlanoContas, TipoPlanoContas, FINANCEIRO_COLORS } from "@/types/financeiro";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";

const tipoColors: Record<TipoPlanoContas, string> = {
  receita: "bg-info/10 text-info border-info/20",
  despesa: "bg-destructive/10 text-destructive border-destructive/20",
  custo: "bg-destructive/10 text-destructive border-destructive/20",
  imposto: "bg-muted text-muted-foreground",
  repasse: "bg-warning/10 text-warning border-warning/20",
  investimento: "bg-success/10 text-success border-success/20",
};

function TreeNode({ item, children: filhos, onEdit, onDelete, level = 0 }: {
  item: PlanoContas; children: PlanoContas[]; onEdit: (p: PlanoContas) => void; onDelete: (id: string) => void; level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const { getFilhosPlanoContas } = useFinanceiro();
  const childItems = getFilhosPlanoContas(item.id);

  return (
    <div>
      <div className={`flex items-center gap-2 py-1.5 px-2 hover:bg-accent/50 rounded-md group`} style={{ paddingLeft: `${level * 20 + 8}px` }}>
        {childItems.length > 0 ? (
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : <span className="w-4" />}
        <span className="text-xs font-mono text-muted-foreground w-12">{item.codigo}</span>
        <span className={`text-sm font-medium flex-1 ${!item.ativo ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.nome}</span>
        <Badge variant="outline" className={`text-[10px] ${tipoColors[item.tipo]}`}>{item.tipo}</Badge>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(item)}><Edit className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
        </div>
      </div>
      {expanded && childItems.map(child => (
        <TreeNode key={child.id} item={child} children={[]} onEdit={onEdit} onDelete={onDelete} level={level + 1} />
      ))}
    </div>
  );
}

export default function PlanoDeContas() {
  const { planoContas, addPlanoContas, updatePlanoContas, deletePlanoContas, getFilhosPlanoContas, loading, exportFinanceiro } = useFinanceiro();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlanoContas | null>(null);
  const [form, setForm] = useState({ codigo: "", nome: "", tipo: "receita" as TipoPlanoContas, paiId: "" });

  const raizes = getFilhosPlanoContas(null);

  const handleEdit = (p: PlanoContas) => {
    setEditing(p);
    setForm({ codigo: p.codigo, nome: p.nome, tipo: p.tipo, paiId: p.paiId || "" });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const ok = deletePlanoContas(id);
    if (ok) toast.success("Conta excluída");
    else toast.error("Não é possível excluir conta com filhos ou lançamentos vinculados");
  };

  const handleSave = () => {
    if (!form.codigo || !form.nome) { toast.error("Preencha código e nome"); return; }
    if (editing) {
      updatePlanoContas(editing.id, { codigo: form.codigo, nome: form.nome, tipo: form.tipo, paiId: form.paiId || null });
      toast.success("Conta atualizada");
    } else {
      addPlanoContas({ codigo: form.codigo, nome: form.nome, tipo: form.tipo, paiId: form.paiId || null, ativo: true });
      toast.success("Conta criada");
    }
    setModalOpen(false);
    setEditing(null);
    setForm({ codigo: "", nome: "", tipo: "receita", paiId: "" });
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(planoContas, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "plano-contas.json"; a.click();
    toast.success("Plano de contas exportado");
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plano de Contas</h1>
          <p className="text-muted-foreground text-sm">Estrutura contábil hierárquica</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJSON}><Download className="h-4 w-4 mr-1" /> Exportar</Button>
          <Button onClick={() => { setEditing(null); setForm({ codigo: "", nome: "", tipo: "receita", paiId: "" }); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova Conta
          </Button>
        </div>
      </div>
      <ModuleNavGrid moduleId="financeiro" />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><FolderTree className="h-4 w-4" /> Árvore de Contas</CardTitle>
        </CardHeader>
        <CardContent>
          {raizes.map(r => (
            <TreeNode key={r.id} item={r} children={[]} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Conta" : "Nova Conta"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Código *</Label><Input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} placeholder="1.01.01" /></div>
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as TipoPlanoContas }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="custo">Custo</SelectItem>
                  <SelectItem value="repasse">Repasse</SelectItem>
                  <SelectItem value="imposto">Imposto</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Conta pai</Label>
              <Select value={form.paiId} onValueChange={v => setForm(p => ({ ...p, paiId: v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma (raiz)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma (raiz)</SelectItem>
                  {planoContas.filter(p => !p.paiId).map(p => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
