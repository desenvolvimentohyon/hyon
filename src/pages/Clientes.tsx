import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Clientes() {
  const { clientes, addCliente, tarefas, getStatusLabel, getPrioridadeLabel } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [showNovo, setShowNovo] = useState(searchParams.get("novo") === "1");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // form
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [obs, setObs] = useState("");

  const filtered = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));
  const selected = clientes.find(c => c.id === selectedId);
  const clienteTarefas = selectedId ? tarefas.filter(t => t.clienteId === selectedId) : [];

  const handleCriar = () => {
    if (!nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    addCliente({ nome: nome.trim(), telefone: telefone || undefined, email: email || undefined, documento: documento || undefined, observacoes: obs || undefined });
    toast({ title: "Cliente cadastrado!" });
    setShowNovo(false);
    setNome(""); setTelefone(""); setEmail(""); setDocumento(""); setObs("");
  };

  if (selected) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5 -ml-2"><ArrowLeft className="h-4 w-4" />Voltar</Button>
        <h1 className="text-2xl font-bold">{selected.nome}</h1>
        <Card>
          <CardContent className="pt-6 space-y-2 text-sm">
            {selected.telefone && <p><span className="text-muted-foreground">Telefone:</span> {selected.telefone}</p>}
            {selected.email && <p><span className="text-muted-foreground">Email:</span> {selected.email}</p>}
            {selected.documento && <p><span className="text-muted-foreground">Documento:</span> {selected.documento}</p>}
            {selected.observacoes && <p><span className="text-muted-foreground">Obs:</span> {selected.observacoes}</p>}
            <p><span className="text-muted-foreground">Cadastrado em:</span> {new Date(selected.criadoEm).toLocaleDateString("pt-BR")}</p>
          </CardContent>
        </Card>
        <h2 className="text-lg font-semibold">Tarefas ({clienteTarefas.length})</h2>
        {clienteTarefas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa vinculada</p>
        ) : (
          <div className="space-y-2">
            {clienteTarefas.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/tarefas/${t.id}`)}>
                <Badge variant="outline" className="text-[10px]">{getStatusLabel(t.status)}</Badge>
                <span className="text-sm font-medium flex-1">{t.titulo}</span>
                <Badge variant="outline" className="text-[10px]">{getPrioridadeLabel(t.prioridade)}</Badge>
              </div>
            ))}
          </div>
        )}
        <Button size="sm" onClick={() => navigate(`/tarefas?nova=1`)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Nova Tarefa</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <Button size="sm" onClick={() => setShowNovo(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo Cliente</Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" />
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Tarefas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(c.id)}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{c.telefone || "—"}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{c.email || "—"}</TableCell>
                <TableCell><Badge variant="outline">{tarefas.filter(t => t.clienteId === c.id).length}</Badge></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showNovo} onOpenChange={setShowNovo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
            </div>
            <div><Label>Documento</Label><Input value={documento} onChange={e => setDocumento(e.target.value)} /></div>
            <div><Label>Observações</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovo(false)}>Cancelar</Button>
            <Button onClick={handleCriar}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
