import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";
import { maskDocument } from "@/lib/cnpjUtils";
import { useParametros } from "@/contexts/ParametrosContext";

interface Props {
  cliente: ClienteFull;
  onSave: (changes: Partial<ClienteFull>) => Promise<boolean>;
}

export default function TabGeral({ cliente, onSave }: Props) {
  const { sistemas } = useParametros();
  const sistemasAtivos = sistemas.filter(s => s.ativo);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: cliente.name,
    trade_name: cliente.trade_name || "",
    legal_name: cliente.legal_name || "",
    document: cliente.document || "",
    state_registration: cliente.state_registration || "",
    company_branch_type: cliente.company_branch_type || "matriz",
    status: cliente.status || "ativo",
    email: cliente.email || "",
    phone: cliente.phone || "",
    notes: cliente.notes || "",
    system_name: cliente.system_name || "",
    support_type: cliente.support_type || "diurno",
    preferred_channel: cliente.preferred_channel || "whatsapp",
    environment_notes: cliente.environment_notes || "",
    technical_notes: cliente.technical_notes || "",
    tags: (cliente.tags || []).join(", "),
    risk_reason: cliente.risk_reason || "",
  });

  const handleSave = async () => {
    const ok = await onSave({
      name: form.name,
      trade_name: form.trade_name || null,
      legal_name: form.legal_name || null,
      document: form.document || null,
      state_registration: form.state_registration || null,
      company_branch_type: form.company_branch_type || "matriz",
      status: form.status,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
      system_name: form.system_name || null,
      support_type: form.support_type || null,
      preferred_channel: form.preferred_channel || null,
      environment_notes: form.environment_notes || null,
      technical_notes: form.technical_notes || null,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      risk_reason: form.risk_reason || null,
    } as any);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Gerais</p>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">Nome:</span> {cliente.name}</div>
            <div><span className="text-muted-foreground">Nome Fantasia:</span> {cliente.trade_name || "—"}</div>
            <div><span className="text-muted-foreground">Razão Social:</span> {cliente.legal_name || "—"}</div>
            <div><span className="text-muted-foreground">CNPJ/CPF:</span> {cliente.document || "—"}</div>
            <div><span className="text-muted-foreground">IE:</span> {cliente.state_registration || "—"}</div>
            <div><span className="text-muted-foreground">Vínculo:</span> {cliente.company_branch_type === "filial" ? "Filial" : "Matriz"}</div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className="text-[10px]">{cliente.status}</Badge></div>
            <div><span className="text-muted-foreground">Email:</span> {cliente.email || "—"}</div>
            <div><span className="text-muted-foreground">Telefone:</span> {cliente.phone || "—"}</div>
            <div><span className="text-muted-foreground">Sistema:</span> {cliente.system_name || "—"}</div>
            <div><span className="text-muted-foreground">Suporte:</span> {cliente.support_type || "—"}</div>
            <div><span className="text-muted-foreground">Canal preferido:</span> {cliente.preferred_channel || "—"}</div>
          </div>
          {cliente.environment_notes && <div className="text-sm"><span className="text-muted-foreground">Ambiente:</span> {cliente.environment_notes}</div>}
          {cliente.technical_notes && <div className="text-sm"><span className="text-muted-foreground">Inventário técnico:</span> {cliente.technical_notes}</div>}
          {(cliente.tags || []).length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {(cliente.tags || []).map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
            </div>
          )}
          {cliente.notes && <div className="text-sm"><span className="text-muted-foreground">Observações:</span> {cliente.notes}</div>}
          <div className="text-xs text-muted-foreground">Cadastrado em: {new Date(cliente.created_at).toLocaleDateString("pt-BR")}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Dados Gerais</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label>Nome Fantasia</Label><Input value={form.trade_name} onChange={e => setForm(p => ({ ...p, trade_name: e.target.value }))} /></div>
          <div><Label>Razão Social</Label><Input value={form.legal_name} onChange={e => setForm(p => ({ ...p, legal_name: e.target.value }))} /></div>
          <div><Label>CNPJ/CPF</Label><Input value={form.document} onChange={e => setForm(p => ({ ...p, document: maskDocument(e.target.value) }))} /></div>
          <div><Label>Inscrição Estadual</Label><Input value={form.state_registration} onChange={e => setForm(p => ({ ...p, state_registration: e.target.value }))} /></div>
          <div>
            <Label>Vínculo</Label>
            <Select value={form.company_branch_type} onValueChange={v => setForm(p => ({ ...p, company_branch_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="matriz">Matriz</SelectItem>
                <SelectItem value="filial">Filial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="atraso">Atraso</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          <div><Label>Sistema</Label><Input value={form.system_name} onChange={e => setForm(p => ({ ...p, system_name: e.target.value }))} /></div>
          <div>
            <Label>Tipo Suporte</Label>
            <Select value={form.support_type} onValueChange={v => setForm(p => ({ ...p, support_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="diurno">Diurno</SelectItem>
                <SelectItem value="noturno">Noturno</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Canal Preferido</Label>
            <Select value={form.preferred_channel} onValueChange={v => setForm(p => ({ ...p, preferred_channel: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telefone">Telefone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Ambiente (ex: "usa TEF", "2 caixas")</Label><Textarea value={form.environment_notes} onChange={e => setForm(p => ({ ...p, environment_notes: e.target.value }))} rows={2} /></div>
        <div><Label>Inventário Técnico</Label><Textarea value={form.technical_notes} onChange={e => setForm(p => ({ ...p, technical_notes: e.target.value }))} rows={2} placeholder="Equipamentos, integrações..." /></div>
        <div><Label>Tags (separar por vírgula)</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="alto suporte, bom pagador, prioritário" /></div>
        <div><Label>Motivo do risco</Label><Input value={form.risk_reason} onChange={e => setForm(p => ({ ...p, risk_reason: e.target.value }))} /></div>
        <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" />Salvar</Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
