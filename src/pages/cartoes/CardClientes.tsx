import { useState } from "react";
import { useCardClients, CardClient } from "@/hooks/useCardClients";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RowActions } from "@/components/ui/row-actions";
import { Plus, Search, Link2, Pencil, Link } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  lead: { label: "Lead", variant: "outline" },
  proposta_enviada: { label: "Proposta Enviada", variant: "secondary" },
  em_negociacao: { label: "Em Negociação", variant: "secondary" },
  ativo: { label: "Ativo", variant: "default" },
  recusado: { label: "Recusado", variant: "destructive" },
  inativo: { label: "Inativo", variant: "outline" },
};

const MACHINE_BADGE: Record<string, string> = {
  fiscal: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  nao_fiscal: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

const emptyForm = { name: "", company_name: "", cnpj: "", phone: "", email: "", city: "", card_machine_type: "fiscal" as string };

export default function CardClientes() {
  const { data: clients, isLoading, create, update } = useCardClients();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterType, setFilterType] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<CardClient | null>(null);
  const [form, setForm] = useState(emptyForm);

  // ERP linking
  const [linkingClientId, setLinkingClientId] = useState<string | null>(null);
  const [erpSearch, setErpSearch] = useState("");
  const [erpResults, setErpResults] = useState<any[]>([]);
  const [erpLoading, setErpLoading] = useState(false);

  const navigate = useNavigate();

  const filtered = (clients || []).filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company_name?.toLowerCase().includes(search.toLowerCase()) || c.cnpj?.includes(search);
    const matchStatus = filterStatus === "todos" || c.status === filterStatus;
    const matchType = filterType === "todos" || c.card_machine_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: CardClient) => {
    setEditingClient(c);
    setForm({
      name: c.name,
      company_name: c.company_name || "",
      cnpj: c.cnpj || "",
      phone: c.phone || "",
      email: c.email || "",
      city: c.city || "",
      card_machine_type: c.card_machine_type,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    try {
      if (editingClient) {
        await update.mutateAsync({ id: editingClient.id, ...form } as any);
        toast.success("Cliente atualizado!");
      } else {
        await create.mutateAsync(form as any);
        toast.success("Cliente criado!");
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingClient(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const searchErp = async () => {
    if (erpSearch.length < 2) return;
    setErpLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("id, name, document, trade_name")
      .or(`name.ilike.%${erpSearch}%,document.ilike.%${erpSearch}%,trade_name.ilike.%${erpSearch}%`)
      .limit(10);
    setErpResults(data || []);
    setErpLoading(false);
  };

  const linkErp = async (erpId: string) => {
    if (!linkingClientId) return;
    try {
      await update.mutateAsync({ id: linkingClientId, linked_client_id: erpId } as any);
      toast.success("Cliente vinculado ao ERP!");
      setLinkingClientId(null);
      setErpSearch("");
      setErpResults([]);
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Clientes — Maquininha" subtitle={`${filtered.length} clientes`} actions={
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      } />
      <ModuleNavGrid moduleId="cartoes" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Tipos</SelectItem>
            <SelectItem value="fiscal">Fiscal</SelectItem>
            <SelectItem value="nao_fiscal">Não Fiscal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="neon-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Vínculo ERP</TableHead>
                <TableHead className="w-10">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => {
                const st = STATUS_MAP[c.status] || STATUS_MAP.lead;
                return (
                  <TableRow key={c.id} className="group cursor-pointer" onClick={() => navigate(`/cartoes/clientes/${c.id}`)}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        {c.company_name && <p className="text-xs text-muted-foreground">{c.company_name}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={MACHINE_BADGE[c.card_machine_type] || ""}>
                        {c.card_machine_type === "fiscal" ? "Fiscal" : "Não Fiscal"}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.city || "—"}</TableCell>
                    <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                    <TableCell>
                      {c.linked_client_id ? (
                        <Badge variant="default" className="gap-1 text-xs"><Link2 className="h-3 w-3" />Vinculado</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 gap-1"
                          onClick={(e) => { e.stopPropagation(); setLinkingClientId(c.id); }}
                        >
                          <Link className="h-3 w-3" />Vincular
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <RowActions actions={[
                        { label: "Editar", icon: Pencil, onClick: () => openEdit(c) },
                        ...(!c.linked_client_id ? [{ label: "Vincular ERP", icon: Link2, onClick: () => setLinkingClientId(c.id) }] : []),
                      ]} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Nenhum cliente encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingClient(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"} — Maquininha</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Razão Social</Label>
                <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Máquina</Label>
              <Select value={form.card_machine_type} onValueChange={v => setForm(f => ({ ...f, card_machine_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiscal">Fiscal</SelectItem>
                  <SelectItem value="nao_fiscal">Não Fiscal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
              {(create.isPending || update.isPending) ? "Salvando..." : editingClient ? "Salvar Alterações" : "Criar Cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ERP Linking Dialog */}
      <Dialog open={!!linkingClientId} onOpenChange={(open) => { if (!open) { setLinkingClientId(null); setErpSearch(""); setErpResults([]); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Vincular ao ERP</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nome, CNPJ ou nome fantasia..."
                value={erpSearch}
                onChange={e => setErpSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchErp()}
              />
              <Button onClick={searchErp} disabled={erpLoading} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {erpResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-[240px] overflow-y-auto">
                {erpResults.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.document || "Sem CNPJ"}{r.trade_name ? ` — ${r.trade_name}` : ""}</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => linkErp(r.id)}>
                      <Link2 className="h-3 w-3 mr-1" />Vincular
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {erpResults.length === 0 && erpSearch.length >= 2 && !erpLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente encontrado no ERP</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
