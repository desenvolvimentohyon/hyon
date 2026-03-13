import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "@/hooks/use-toast";
import { Tecnico } from "@/types";

export default function Tecnicos() {
  const { tecnicos, addTecnico, updateTecnico, tecnicoAtualId, setTecnicoAtual } = useApp();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(searchParams.get("novo") === "1");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const openEdit = (t: Tecnico) => {
    setEditingId(t.id);
    setNome(t.nome);
    setTelefone(t.telefone || "");
    setEmail(t.email || "");
    setShowForm(true);
  };

  const openNew = () => {
    setEditingId(null);
    setNome(""); setTelefone(""); setEmail("");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    if (editingId) {
      updateTecnico(editingId, { nome: nome.trim(), telefone: telefone || undefined, email: email || undefined });
      toast({ title: "Técnico atualizado!" });
    } else {
      addTecnico({ nome: nome.trim(), telefone: telefone || undefined, email: email || undefined, ativo: true });
      toast({ title: "Técnico cadastrado!" });
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Técnicos</h1>
        <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" />Novo Técnico</Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atual</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tecnicos.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nome}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{t.telefone || "—"}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{t.email || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={t.ativo} onCheckedChange={v => updateTecnico(t.id, { ativo: v })} />
                    <Badge variant={t.ativo ? "default" : "secondary"} className="text-[10px]">{t.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {t.ativo && (
                    <Button variant={tecnicoAtualId === t.id ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => { setTecnicoAtual(t.id); toast({ title: `Técnico atual: ${t.nome}` }); }}>
                      {tecnicoAtualId === t.id ? "Selecionado" : "Selecionar"}
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Técnico</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
