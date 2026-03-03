import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Handshake } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Partner {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  commission_percent: number;
  commission_type: string;
  notes: string | null;
  created_at: string;
}

interface PartnerWithTotals extends Partner {
  total_comissoes: number;
  total_pago: number;
}

export default function Parceiros() {
  const [partners, setPartners] = useState<PartnerWithTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<string>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);

  const [form, setForm] = useState({ name: "", document: "", phone: "", email: "", commission_percent: "10", commission_type: "apenas_implantacao", notes: "", active: true });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const { data: pData } = await supabase.from("partners").select("*").order("name");
    if (!pData) { setLoading(false); return; }

    // Fetch commission totals from financial_titles
    const partnerIds = pData.map(p => p.id);
    let commissionMap = new Map<string, { total: number; pago: number }>();

    if (partnerIds.length > 0) {
      const { data: titles } = await supabase
        .from("financial_titles")
        .select("partner_id, value_original, status")
        .eq("origin", "comissao_parceiro")
        .in("partner_id", partnerIds);

      if (titles) {
        titles.forEach(t => {
          if (!t.partner_id) return;
          const existing = commissionMap.get(t.partner_id) || { total: 0, pago: 0 };
          existing.total += t.value_original;
          if (t.status === "pago") existing.pago += t.value_original;
          commissionMap.set(t.partner_id, existing);
        });
      }
    }

    setPartners(pData.map(p => ({
      ...p,
      total_comissoes: commissionMap.get(p.id)?.total || 0,
      total_pago: commissionMap.get(p.id)?.pago || 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const filtered = useMemo(() => {
    let list = partners;
    if (busca) list = list.filter(p => p.name.toLowerCase().includes(busca.toLowerCase()));
    if (filtroAtivo === "ativo") list = list.filter(p => p.active);
    if (filtroAtivo === "inativo") list = list.filter(p => !p.active);
    return list;
  }, [partners, busca, filtroAtivo]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", document: "", phone: "", email: "", commission_percent: "10", commission_type: "apenas_implantacao", notes: "", active: true });
    setModalOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({ name: p.name, document: p.document || "", phone: p.phone || "", email: p.email || "", commission_percent: String(p.commission_percent), commission_type: p.commission_type, notes: p.notes || "", active: p.active });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const payload = {
      name: form.name.trim(),
      document: form.document || null,
      phone: form.phone || null,
      email: form.email || null,
      commission_percent: parseFloat(form.commission_percent) || 0,
      commission_type: form.commission_type,
      notes: form.notes || null,
      active: form.active,
    };

    if (editing) {
      const { error } = await supabase.from("partners").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Parceiro atualizado!");
    } else {
      const { data: org } = await supabase.from("organizations").select("id").limit(1).single();
      if (!org) { toast.error("Organização não encontrada"); return; }
      const { error } = await supabase.from("partners").insert({ ...payload, org_id: org.id });
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Parceiro criado!");
    }
    setModalOpen(false);
    fetchPartners();
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Handshake className="h-6 w-6 text-primary" /> Parceiros Indicadores</h1>
          <p className="text-muted-foreground text-sm">Gerencie parceiros e comissões de indicação</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Parceiro</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar parceiro..." value={busca} onChange={e => setBusca(e.target.value)} className="w-56" />
        <Select value={filtroAtivo} onValueChange={setFiltroAtivo}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Comissão %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Comissões</TableHead>
                <TableHead>Total Pago</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum parceiro encontrado</TableCell></TableRow>
              )}
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.document || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{p.commission_percent}%</Badge></TableCell>
                  <TableCell>
                    <Badge variant={p.active ? "default" : "secondary"} className={p.active ? "bg-success/10 text-success border-success/20" : ""}>
                      {p.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">{fmt(p.total_comissoes)}</TableCell>
                  <TableCell className="text-sm">{fmt(p.total_pago)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Documento (CPF/CNPJ)</Label><Input value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Comissão (%)</Label><Input type="number" value={form.commission_percent} onChange={e => setForm(f => ({ ...f, commission_percent: e.target.value }))} /></div>
              <div><Label>Tipo Comissão</Label>
                <Select value={form.commission_type} onValueChange={v => setForm(f => ({ ...f, commission_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apenas_implantacao">Apenas Implantação</SelectItem>
                    <SelectItem value="implantacao_e_mensalidade">Implantação + Mensalidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Ativo</Label>
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
