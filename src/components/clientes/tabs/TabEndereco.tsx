import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Search, Loader2 } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";
import { toast } from "@/hooks/use-toast";

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

interface Props {
  cliente: ClienteFull;
  onSave: (changes: Partial<ClienteFull>) => Promise<boolean>;
}

export default function TabEndereco({ cliente, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [form, setForm] = useState({
    address_cep: cliente.address_cep || "",
    address_street: cliente.address_street || "",
    address_number: cliente.address_number || "",
    address_complement: cliente.address_complement || "",
    address_neighborhood: cliente.address_neighborhood || "",
    city: cliente.city || "",
    address_uf: cliente.address_uf || "",
    address_reference: cliente.address_reference || "",
  });

  const buscarCep = async () => {
    const cep = form.address_cep.replace(/\D/g, "");
    if (cep.length !== 8) { toast({ title: "CEP inválido", variant: "destructive" }); return; }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { toast({ title: "CEP não encontrado", variant: "destructive" }); return; }
      setForm(p => ({
        ...p,
        address_street: data.logradouro || p.address_street,
        address_neighborhood: data.bairro || p.address_neighborhood,
        city: data.localidade || p.city,
        address_uf: data.uf || p.address_uf,
      }));
    } catch {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  };

  const handleSave = async () => {
    const ok = await onSave({
      address_cep: form.address_cep || null,
      address_street: form.address_street || null,
      address_number: form.address_number || null,
      address_complement: form.address_complement || null,
      address_neighborhood: form.address_neighborhood || null,
      city: form.city || null,
      address_uf: form.address_uf || null,
      address_reference: form.address_reference || null,
    } as any);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</p>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">CEP:</span> {cliente.address_cep || "—"}</div>
            <div><span className="text-muted-foreground">Logradouro:</span> {cliente.address_street || "—"}</div>
            <div><span className="text-muted-foreground">Número:</span> {cliente.address_number || "—"}</div>
            <div><span className="text-muted-foreground">Complemento:</span> {cliente.address_complement || "—"}</div>
            <div><span className="text-muted-foreground">Bairro:</span> {cliente.address_neighborhood || "—"}</div>
            <div><span className="text-muted-foreground">Cidade:</span> {cliente.city || "—"}</div>
            <div><span className="text-muted-foreground">UF:</span> {cliente.address_uf || "—"}</div>
            <div><span className="text-muted-foreground">Referência:</span> {cliente.address_reference || "—"}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Endereço</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>CEP</Label>
              <Input value={form.address_cep} onChange={e => setForm(p => ({ ...p, address_cep: e.target.value }))} placeholder="00000-000" />
            </div>
            <Button size="icon" variant="outline" onClick={buscarCep} disabled={cepLoading} className="shrink-0">
              {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="md:col-span-2"><Label>Logradouro</Label><Input value={form.address_street} onChange={e => setForm(p => ({ ...p, address_street: e.target.value }))} /></div>
          <div><Label>Número</Label><Input value={form.address_number} onChange={e => setForm(p => ({ ...p, address_number: e.target.value }))} /></div>
          <div><Label>Complemento</Label><Input value={form.address_complement} onChange={e => setForm(p => ({ ...p, address_complement: e.target.value }))} /></div>
          <div><Label>Bairro</Label><Input value={form.address_neighborhood} onChange={e => setForm(p => ({ ...p, address_neighborhood: e.target.value }))} /></div>
          <div><Label>Cidade</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
          <div>
            <Label>UF</Label>
            <Select value={form.address_uf} onValueChange={v => setForm(p => ({ ...p, address_uf: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Referência</Label><Input value={form.address_reference} onChange={e => setForm(p => ({ ...p, address_reference: e.target.value }))} /></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" />Salvar</Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
