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
  commission_implant_percent: number;
  commission_recur_percent: number;
  commission_recur_months: number;
  commission_recur_apply_on: string;
  notes: string | null;
  created_at: string;
}

interface PartnerWithTotals extends Partner {
  total_comissoes: number;
  total_pago: number;
}

interface PartnerForm {
  name: string;
  document: string;
  phone: string;
  email: string;
  commission_implant_percent: string;
  commission_type: string;
  commission_recur_percent: string;
  commission_recur_months: string;
  commission_recur_apply_on: string;
  notes: string;
  active: boolean;
}

const defaultForm: PartnerForm = {
  name: "", document: "", phone: "", email: "",
  commission_implant_percent: "10", commission_type: "apenas_implantacao",
  commission_recur_percent: "5", commission_recur_months: "12",
  commission_recur_apply_on: "on_invoice_paid",
  notes: "", active: true,
};

export default function Parceiros() {
  const [partners, setPartners] = useState<PartnerWithTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<string>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<PartnerForm>({ ...defaultForm });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const { data: pData } = await supabase.from("partners").select("*").order("name");
    if (!pData) { setLoading(false); return; }

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

    setPartners(pData.map((p: any) => ({
      ...p,
      commission_implant_percent: p.commission_implant_percent ?? p.commission_percent ?? 0,
      commission_recur_percent: p.commission_recur_percent ?? 0,
      commission_recur_months: p.commission_recur_months ?? 0,
      commission_recur_apply_on: p.commission_recur_apply_on ?? "on_invoice_paid",
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
    setForm({ ...defaultForm });
    setModalOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({
      name: p.name, document: p.document || "", phone: p.phone || "", email: p.email || "",
      commission_implant_percent: String(p.commission_implant_percent),
      commission_type: p.commission_type,
      commission_recur_percent: String(p.commission_recur_percent),
      commission_recur_months: String(p.commission_recur_months),
      commission_recur_apply_on: p.commission_recur_apply_on,
      notes: p.notes || "", active: p.active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const implantPct = parseFloat(form.commission_implant_percent) || 0;
    const payload: any = {
      name: form.name.trim(),
      document: form.document || null,
      phone: form.phone || null,
      email: form.email || null,
      commission_percent: implantPct, // backward compat
      commission_implant_percent: implantPct,
      commission_type: form.commission_type,
      commission_recur_percent: form.commission_type === "implantacao_e_mensalidade" ? (parseFloat(form.commission_recur_percent) || 0) : 0,
      commission_recur_months: form.commission_type === "implantacao_e_mensalidade" ? (parseInt(form.commission_recur_months) || 0) : 0,
      commission_recur_apply_on: form.commission_type === "implantacao_e_mensalidade" ? form.commission_recur_apply_on : "on_invoice_paid",
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
                <TableHead>Comissão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Comissões</TableHead>
                <TableHead>Total Pago</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum parceiro encontrado</TableCell></TableRow>
              )}
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.document || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge variant="outline" className="text-xs">Impl: {p.commission_implant_percent}%</Badge>
                      {p.commission_type === "implantacao_e_mensalidade" && (
                        <Badge variant="outline" className="text-xs">Recor: {p.commission_recur_percent}%{p.commission_recur_months > 0 ? ` (${p.commission_recur_months}m)` : " (∞)"}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {p.commission_type === "implantacao_e_mensalidade" ? "Impl + Recor" : "Implantação"}
                    </Badge>
                  </TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Documento (CPF/CNPJ)</Label><Input value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>% Comissão Implantação</Label><Input type="number" value={form.commission_implant_percent} onChange={e => setForm(f => ({ ...f, commission_implant_percent: e.target.value }))} /></div>
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
            {form.commission_type === "implantacao_e_mensalidade" && (
              <div className="space-y-3 rounded-md border p-3 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">Comissão Recorrente (Mensalidade)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>% Comissão Mensalidade</Label><Input type="number" value={form.commission_recur_percent} onChange={e => setForm(f => ({ ...f, commission_recur_percent: e.target.value }))} /></div>
                  <div><Label>Duração (meses, 0=ilimitado)</Label><Input type="number" value={form.commission_recur_months} onChange={e => setForm(f => ({ ...f, commission_recur_months: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>Aplicar comissão recorrente em</Label>
                  <Select value={form.commission_recur_apply_on} onValueChange={v => setForm(f => ({ ...f, commission_recur_apply_on: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_invoice_paid">Ao pagar mensalidade</SelectItem>
                      <SelectItem value="on_invoice_created">Ao gerar mensalidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
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
