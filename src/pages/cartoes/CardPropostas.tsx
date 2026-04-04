import { useState } from "react";
import { useCardProposals, CardProposal } from "@/hooks/useCardProposals";
import { useCardClients } from "@/hooks/useCardClients";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ExternalLink, MessageCircle, Copy, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  enviada: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  visualizada: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  aceita: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  recusada: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  expirada: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

const emptyForm = { title: "", machine_type: "fiscal", commission_percent: 30, validity_days: 7 };

export default function CardPropostas() {
  const { data: proposals, isLoading, create, update } = useCardProposals();
  const { data: clients } = useCardClients();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<CardProposal | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const getPublicUrl = (token: string) => `${window.location.origin}/cartoes/proposta/${token}`;

  const openCreate = () => {
    setEditingProposal(null);
    setSelectedClientId("");
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: CardProposal) => {
    setEditingProposal(p);
    setSelectedClientId(p.card_client_id);
    setForm({
      title: p.title || "",
      machine_type: p.machine_type,
      commission_percent: p.commission_percent,
      validity_days: p.validity_days,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedClientId) { toast.error("Selecione um cliente"); return; }
    try {
      if (editingProposal) {
        await update.mutateAsync({
          id: editingProposal.id,
          title: form.title,
          machine_type: form.machine_type,
          commission_percent: form.commission_percent,
          validity_days: form.validity_days,
        });
        toast.success("Proposta atualizada!");
        setDialogOpen(false);
      } else {
        const result = await create.mutateAsync({
          card_client_id: selectedClientId,
          title: form.title,
          machine_type: form.machine_type,
          commission_percent: form.commission_percent,
          validity_days: form.validity_days,
        });
        toast.success("Proposta criada!");
        setDialogOpen(false);
        const url = getPublicUrl(result.public_token);
        navigator.clipboard.writeText(url);
        toast.info("Link copiado para a área de transferência!");
      }
      setEditingProposal(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSend = async (p: CardProposal) => {
    await update.mutateAsync({ id: p.id, status: "enviada", sent_at: new Date().toISOString() });
    toast.success("Proposta marcada como enviada!");
  };

  const handleCopyLink = (token: string) => {
    navigator.clipboard.writeText(getPublicUrl(token));
    toast.success("Link copiado!");
  };

  const handleWhatsApp = (p: CardProposal) => {
    const url = getPublicUrl(p.public_token);
    const clientName = p.card_clients?.name || "Cliente";
    const msg = `Olá ${clientName}! Segue a proposta de máquina de cartão: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (isLoading) {
    return <div className="p-6"><Skeleton className="h-[400px] w-full rounded-xl" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Propostas — Maquininha" subtitle={`${(proposals || []).length} propostas`} actions={
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Proposta
        </Button>
      } />
      <ModuleNavGrid moduleId="cartoes" />

      <Card className="neon-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(proposals || []).map(p => (
                <TableRow key={p.id} className="group">
                  <TableCell className="font-medium">{p.card_clients?.name || "—"}</TableCell>
                  <TableCell>{p.title || "—"}</TableCell>
                  <TableCell>
                    <Badge className={p.machine_type === "fiscal" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"}>
                      {p.machine_type === "fiscal" ? "Fiscal" : "Não Fiscal"}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.commission_percent}%</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[p.status] || ""}>{p.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.status === "draft" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyLink(p.public_token)} title="Copiar link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleWhatsApp(p)} title="WhatsApp">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                      {p.status === "draft" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSend(p)} title="Marcar como enviada">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(getPublicUrl(p.public_token), "_blank")} title="Visualizar">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!proposals || proposals.length === 0) && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Nenhuma proposta</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingProposal(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingProposal ? "Editar Proposta" : "Nova Proposta"} — Maquininha</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={!!editingProposal}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(clients || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.company_name ? ` — ${c.company_name}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Proposta Maquininha Fiscal" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.machine_type} onValueChange={v => setForm(f => ({ ...f, machine_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                    <SelectItem value="nao_fiscal">Não Fiscal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Comissão (%)</Label>
                <Input type="number" value={form.commission_percent} onChange={e => setForm(f => ({ ...f, commission_percent: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Validade (dias)</Label>
                <Input type="number" value={form.validity_days} onChange={e => setForm(f => ({ ...f, validity_days: Number(e.target.value) }))} />
              </div>
            </div>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
              {(create.isPending || update.isPending) ? "Salvando..." : editingProposal ? "Salvar Alterações" : "Criar Proposta e Copiar Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
