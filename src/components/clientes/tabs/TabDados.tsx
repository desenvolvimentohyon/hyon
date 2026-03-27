import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Loader2, Plus, Pencil, Trash2, Star } from "lucide-react";
import type { ClienteFull, ClienteContact } from "@/hooks/useClienteDetalhe";
import { maskDocument, validateCNPJ, cleanCNPJ } from "@/lib/cnpjUtils";
import { toast } from "@/hooks/use-toast";
import { useParametros } from "@/contexts/ParametrosContext";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const ROLE_OPTIONS = [
  { value: "financeiro", label: "Financeiro" },
  { value: "fiscal", label: "Fiscal" },
  { value: "compras", label: "Compras" },
  { value: "operacao_pdv", label: "Operação/PDV" },
  { value: "ti", label: "TI" },
  { value: "comercial", label: "Comercial" },
  { value: "contador", label: "Contador" },
  { value: "outro", label: "Outro" },
];

interface Props {
  cliente: ClienteFull;
  formData: Partial<ClienteFull>;
  onChange: (changes: Partial<ClienteFull>) => void;
  contacts: ClienteContact[];
  onAddContact: (c: Omit<ClienteContact, "id" | "org_id" | "client_id" | "created_at" | "updated_at">) => Promise<void>;
  onUpdateContact: (id: string, changes: Partial<ClienteContact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
}

export default function TabDados({ cliente, formData, onChange, contacts, onAddContact, onUpdateContact, onDeleteContact }: Props) {
  const { sistemas, modulos, addModulo } = useParametros();
  const { profile } = useAuth();
  const sistemasAtivos = sistemas.filter(s => s.ativo);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", roles: [] as string[], is_billing_preferred: false, is_support_preferred: false });
  const [linkedModules, setLinkedModules] = useState<Map<string, number>>(new Map());
  const [modulesLoading, setModulesLoading] = useState(false);
  const [showNewModuleDialog, setShowNewModuleDialog] = useState(false);
  const [newModuleForm, setNewModuleForm] = useState({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0 });
  const [savingModule, setSavingModule] = useState(false);

  const v = (key: keyof ClienteFull) => (formData[key] ?? cliente[key] ?? "") as string;
  const set = (key: keyof ClienteFull, val: any) => onChange({ [key]: val });

  // Current system name (from form or persisted)
  const currentSystemName = v("system_name");
  const currentSystem = sistemas.find(s => s.nome === currentSystemName);
  const systemModules = modulos.filter(m => m.ativo && (m.sistemaId === currentSystem?.id || m.isGlobal));

  const linkedModuleIds = useMemo(() => Array.from(linkedModules.keys()), [linkedModules]);

  // Calculate totals from linked modules in real time
  const moduleTotals = useMemo(() => {
    const totalVenda = modulos
      .filter(m => linkedModules.has(m.id))
      .reduce((sum, m) => sum + m.valorVenda * (linkedModules.get(m.id) || 1), 0);
    const totalCusto = modulos
      .filter(m => linkedModules.has(m.id))
      .reduce((sum, m) => sum + m.valorCusto * (linkedModules.get(m.id) || 1), 0);
    return { totalVenda, totalCusto };
  }, [linkedModules, modulos]);

  // Load linked modules for this client
  useEffect(() => {
    const loadLinkedModules = async () => {
      if (!cliente.id) return;
      const { data } = await supabase
        .from("client_modules")
        .select("module_id, quantity")
        .eq("client_id", cliente.id);
      if (data) {
        const map = new Map<string, number>();
        data.forEach((d: any) => map.set(d.module_id, d.quantity ?? 1));
        setLinkedModules(map);
      }
    };
    loadLinkedModules();
  }, [cliente.id]);

  const recalcFromMap = useCallback((map: Map<string, number>) => {
    const sumVenda = modulos.filter(m => map.has(m.id)).reduce((s, m) => s + m.valorVenda * (map.get(m.id) || 1), 0);
    const sumCusto = modulos.filter(m => map.has(m.id)).reduce((s, m) => s + m.valorCusto * (map.get(m.id) || 1), 0);
    onChange({ monthly_value_base: sumVenda, monthly_cost_value: sumCusto } as any);
  }, [modulos, onChange]);

  const toggleModule = useCallback(async (moduleId: string, checked: boolean) => {
    if (!profile?.org_id || !cliente.id) return;
    setModulesLoading(true);
    try {
      const newMap = new Map(linkedModules);
      if (checked) {
        await supabase.from("client_modules").insert({ org_id: profile.org_id, client_id: cliente.id, module_id: moduleId });
        newMap.set(moduleId, 1);
      } else {
        await supabase.from("client_modules").delete().eq("client_id", cliente.id).eq("module_id", moduleId);
        newMap.delete(moduleId);
      }
      setLinkedModules(newMap);
      recalcFromMap(newMap);
    } catch {
      toast({ title: "Erro ao atualizar módulo", variant: "destructive" });
    } finally {
      setModulesLoading(false);
    }
  }, [profile?.org_id, cliente.id, linkedModules, modulos, recalcFromMap]);

  const updateModuleQuantity = useCallback(async (moduleId: string, qty: number) => {
    if (!cliente.id || qty < 1) return;
    const newMap = new Map(linkedModules);
    newMap.set(moduleId, qty);
    setLinkedModules(newMap);
    recalcFromMap(newMap);
    try {
      await supabase.from("client_modules").update({ quantity: qty } as any).eq("client_id", cliente.id).eq("module_id", moduleId);
    } catch {
      toast({ title: "Erro ao atualizar quantidade", variant: "destructive" });
    }
  }, [cliente.id, linkedModules, recalcFromMap]);

  const buscarCNPJ = async (cnpjRaw: string) => {
    const cleaned = cleanCNPJ(cnpjRaw);
    if (cleaned.length !== 14 || !validateCNPJ(cleaned)) return;
    setCnpjLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cnpj-lookup", { body: { cnpj: cleaned } });
      if (error || !data || data.error) {
        toast({ title: data?.error || "Erro ao consultar CNPJ", variant: "destructive" });
        return;
      }
      const fantasia = data.fantasia || data.nome || "";
      onChange({
        trade_name: fantasia,
        name: fantasia,
        legal_name: data.nome || "",
        address_cep: data.cep || v("address_cep"),
        address_street: data.logradouro || v("address_street"),
        address_number: data.numero || v("address_number"),
        address_complement: data.complemento || v("address_complement"),
        address_neighborhood: data.bairro || v("address_neighborhood"),
        city: data.municipio || v("city"),
        address_uf: data.uf || v("address_uf"),
        email: data.email || v("email"),
        phone: data.telefone || v("phone"),
      } as any);
      toast({ title: "Dados do CNPJ preenchidos com sucesso" });
    } catch {
      toast({ title: "Erro ao consultar CNPJ", variant: "destructive" });
    } finally {
      setCnpjLoading(false);
    }
  };

  const buscarCep = async () => {
    const cep = v("address_cep").replace(/\D/g, "");
    if (cep.length !== 8) { toast({ title: "CEP inválido", variant: "destructive" }); return; }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { toast({ title: "CEP não encontrado", variant: "destructive" }); return; }
      onChange({
        address_street: data.logradouro || v("address_street"),
        address_neighborhood: data.bairro || v("address_neighborhood"),
        city: data.localidade || v("city"),
        address_uf: data.uf || v("address_uf"),
      } as any);
    } catch {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  };

  const openNewContact = () => {
    setContactForm({ name: "", phone: "", email: "", roles: [], is_billing_preferred: false, is_support_preferred: false });
    setEditingContactId(null);
    setShowContactForm(true);
  };

  const openEditContact = (c: ClienteContact) => {
    setContactForm({ name: c.name, phone: c.phone || "", email: c.email || "", roles: c.roles || [], is_billing_preferred: c.is_billing_preferred, is_support_preferred: c.is_support_preferred });
    setEditingContactId(c.id);
    setShowContactForm(true);
  };

  const toggleRole = (role: string) => {
    setContactForm(p => ({ ...p, roles: p.roles.includes(role) ? p.roles.filter(r => r !== role) : [...p.roles, role] }));
  };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    if (editingContactId) {
      await onUpdateContact(editingContactId, { name: contactForm.name, phone: contactForm.phone || null, email: contactForm.email || null, roles: contactForm.roles, is_billing_preferred: contactForm.is_billing_preferred, is_support_preferred: contactForm.is_support_preferred } as any);
    } else {
      await onAddContact({ name: contactForm.name, phone: contactForm.phone || null, email: contactForm.email || null, roles: contactForm.roles, is_billing_preferred: contactForm.is_billing_preferred, is_support_preferred: contactForm.is_support_preferred });
    }
    setShowContactForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Identificação */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Identificação</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Nome Fantasia *</Label><Input value={v("trade_name")} onChange={e => onChange({ trade_name: e.target.value, name: e.target.value })} placeholder="Nome fantasia" /></div>
          <div><Label>Razão Social</Label><Input value={v("legal_name")} onChange={e => set("legal_name", e.target.value)} placeholder="Razão social" /></div>
          <div className="relative"><Label>CNPJ/CPF</Label><Input value={v("document")} onChange={e => { const masked = maskDocument(e.target.value); set("document", masked); const digits = masked.replace(/\D/g, ""); if (digits.length === 14) buscarCNPJ(digits); }} placeholder="00.000.000/0000-00" />{cnpjLoading && <Loader2 className="absolute right-3 top-8 h-4 w-4 animate-spin text-muted-foreground" />}</div>
          <div><Label>Inscrição Estadual</Label><Input value={v("state_registration")} onChange={e => set("state_registration", e.target.value)} placeholder="Inscrição estadual" /></div>
          <div>
            <Label>Vínculo Empresarial</Label>
            <Select value={v("company_branch_type") || "matriz"} onValueChange={val => set("company_branch_type", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="matriz">Matriz</SelectItem>
                <SelectItem value="filial">Filial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Email</Label><Input value={v("email")} onChange={e => set("email", e.target.value)} placeholder="email@empresa.com" /></div>
          <div><Label>Telefone</Label><Input value={v("phone")} onChange={e => set("phone", e.target.value)} placeholder="(00) 00000-0000" /></div>
          <div>
            <Label>Status</Label>
            <Select value={v("status") || "ativo"} onValueChange={val => set("status", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="atraso">Atraso</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sistema</Label>
            <Select value={v("system_name")} onValueChange={val => {
              set("system_name", val);
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
              <SelectContent>
                {sistemasAtivos.map(s => (
                  <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Módulos do Sistema */}
      {currentSystem && (
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Módulos do Sistema {systemModules.length > 0 && `(${systemModules.length})`}
            </h3>
            <Button size="sm" variant="outline" onClick={() => { setNewModuleForm({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0 }); setShowNewModuleDialog(true); }} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />Novo Módulo
            </Button>
          </div>
          {systemModules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum módulo cadastrado para <strong>{currentSystem.nome}</strong>.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 md:grid-cols-2">
                {systemModules.map(m => {
                  const isLinked = linkedModules.has(m.id);
                  const qty = linkedModules.get(m.id) || 1;
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/40 transition-colors">
                      <Checkbox
                        checked={isLinked}
                        onCheckedChange={(checked) => toggleModule(m.id, !!checked)}
                        disabled={modulesLoading}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">{m.nome}</p>
                          {m.isGlobal && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Global</Badge>}
                        </div>
                        {m.descricao && <p className="text-[10px] text-muted-foreground truncate">{m.descricao}</p>}
                      </div>
                      {isLinked && (
                        <Input
                          type="number"
                          min={1}
                          value={qty}
                          onChange={e => updateModuleQuantity(m.id, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 h-8 text-center text-xs"
                        />
                      )}
                      <div className="text-right min-w-[80px]">
                        <span className="text-xs font-medium whitespace-nowrap">R$ {(m.valorVenda * (isLinked ? qty : 1)).toFixed(2)}</span>
                        <p className="text-[10px] text-muted-foreground">Custo: R$ {(m.valorCusto * (isLinked ? qty : 1)).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {linkedModuleIds.length > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                  <span className="text-muted-foreground">Módulos ativos: <strong className="text-foreground">{linkedModuleIds.length}</strong></span>
                  <span className="text-muted-foreground">Total Venda: <strong className="text-foreground">R$ {moduleTotals.totalVenda.toFixed(2)}</strong></span>
                  <span className="text-muted-foreground">Total Custo: <strong className="text-foreground">R$ {moduleTotals.totalCusto.toFixed(2)}</strong></span>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Endereço */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Endereço</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>CEP</Label>
              <Input value={v("address_cep")} onChange={e => set("address_cep", e.target.value)} placeholder="00000-000" />
            </div>
            <Button size="icon" variant="outline" onClick={buscarCep} disabled={cepLoading} className="shrink-0">
              {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="md:col-span-2"><Label>Logradouro</Label><Input value={v("address_street")} onChange={e => set("address_street", e.target.value)} placeholder="Rua, Avenida..." /></div>
          <div><Label>Número</Label><Input value={v("address_number")} onChange={e => set("address_number", e.target.value)} placeholder="Nº" /></div>
          <div><Label>Complemento</Label><Input value={v("address_complement")} onChange={e => set("address_complement", e.target.value)} placeholder="Sala, Bloco..." /></div>
          <div><Label>Bairro</Label><Input value={v("address_neighborhood")} onChange={e => set("address_neighborhood", e.target.value)} placeholder="Bairro" /></div>
          <div><Label>Cidade</Label><Input value={v("city")} onChange={e => set("city", e.target.value)} placeholder="Cidade" /></div>
          <div>
            <Label>UF</Label>
            <Select value={v("address_uf")} onValueChange={val => set("address_uf", val)}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Referência</Label><Input value={v("address_reference")} onChange={e => set("address_reference", e.target.value)} placeholder="Ponto de referência" /></div>
        </div>
      </section>

      {/* Responsável Principal */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Responsável Principal</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Nome</Label><Input value={v("primary_contact_name")} onChange={e => set("primary_contact_name", e.target.value)} placeholder="Nome do responsável" /></div>
          <div><Label>Cargo/Função</Label><Input value={v("primary_contact_role")} onChange={e => set("primary_contact_role", e.target.value)} placeholder="Ex: Gerente, Financeiro" /></div>
          <div><Label>Email</Label><Input value={v("primary_contact_email")} onChange={e => set("primary_contact_email", e.target.value)} placeholder="email@empresa.com" /></div>
          <div><Label>Telefone/WhatsApp</Label><Input value={v("primary_contact_phone")} onChange={e => set("primary_contact_phone", e.target.value)} placeholder="(00) 00000-0000" /></div>
          <div><Label>Melhor horário para contato</Label><Input value={v("primary_contact_best_time")} onChange={e => set("primary_contact_best_time", e.target.value)} placeholder="Ex: 9h-12h" /></div>
        </div>
      </section>

      {/* Contrato */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Contrato</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Data Assinatura</Label><Input type="date" value={v("contract_signed_at")} onChange={e => set("contract_signed_at", e.target.value)} /></div>
          <div><Label>Data Base Reajuste</Label><Input type="date" value={v("adjustment_base_date")} onChange={e => set("adjustment_base_date", e.target.value)} /></div>
          <div>
            <Label>Tipo Reajuste</Label>
            <Select value={v("adjustment_type")} onValueChange={val => set("adjustment_type", val)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ipca">IPCA</SelectItem>
                <SelectItem value="igpm">IGPM</SelectItem>
                <SelectItem value="fixo">Fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>% Reajuste</Label><Input type="number" value={String(formData.adjustment_percent ?? cliente.adjustment_percent ?? 0)} onChange={e => set("adjustment_percent", Number(e.target.value) || 0)} /></div>
        </div>
      </section>

      {/* Contatos Adicionais */}
      <section className="space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contatos Adicionais ({contacts.length})</h3>
          <Button size="sm" variant="outline" onClick={openNewContact} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Adicionar</Button>
        </div>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum contato adicional cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.is_billing_preferred && <Badge variant="outline" className="text-[9px] gap-1"><Star className="h-2.5 w-2.5" />Cobrança</Badge>}
                    {c.is_support_preferred && <Badge variant="outline" className="text-[9px] gap-1"><Star className="h-2.5 w-2.5" />Suporte</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.phone && <span className="mr-3">📱 {c.phone}</span>}
                    {c.email && <span>✉️ {c.email}</span>}
                  </div>
                  {(c.roles || []).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {c.roles.map(r => <Badge key={r} variant="secondary" className="text-[9px]">{ROLE_OPTIONS.find(o => o.value === r)?.label || r}</Badge>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditContact(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteContactId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Observações */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Observações</h3>
        <Textarea value={v("notes")} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Observações gerais do cliente..." />
      </section>

      {/* Contact Dialog */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingContactId ? "Editar Contato" : "Novo Contato"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone/WhatsApp</Label><Input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div>
              <Label className="mb-2 block">Funções</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(r => (
                  <label key={r.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={contactForm.roles.includes(r.value)} onCheckedChange={() => toggleRole(r.value)} />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={contactForm.is_billing_preferred} onCheckedChange={val => setContactForm(p => ({ ...p, is_billing_preferred: !!val }))} />
                Preferencial para cobrança
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={contactForm.is_support_preferred} onCheckedChange={val => setContactForm(p => ({ ...p, is_support_preferred: !!val }))} />
                Preferencial para suporte
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactForm(false)}>Cancelar</Button>
            <Button onClick={handleSaveContact}>{editingContactId ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteContactId} onOpenChange={() => setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover contato?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteContactId) onDeleteContact(deleteContactId); setDeleteContactId(null); }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Module Dialog */}
      <Dialog open={showNewModuleDialog} onOpenChange={setShowNewModuleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Módulo — {currentSystem?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={newModuleForm.nome} onChange={e => setNewModuleForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do módulo" /></div>
            <div><Label>Descrição</Label><Input value={newModuleForm.descricao} onChange={e => setNewModuleForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição opcional" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor Custo</Label><CurrencyInput value={newModuleForm.valorCusto} onValueChange={v => setNewModuleForm(p => ({ ...p, valorCusto: v }))} /></div>
              <div><Label>Valor Venda</Label><CurrencyInput value={newModuleForm.valorVenda} onValueChange={v => setNewModuleForm(p => ({ ...p, valorVenda: v }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModuleDialog(false)}>Cancelar</Button>
            <Button disabled={savingModule || !newModuleForm.nome.trim()} onClick={async () => {
              if (!currentSystem) return;
              setSavingModule(true);
              try {
                await addModulo({ nome: newModuleForm.nome, descricao: newModuleForm.descricao, valorCusto: newModuleForm.valorCusto, valorVenda: newModuleForm.valorVenda, ativo: true, sistemaId: currentSystem.id });
                setShowNewModuleDialog(false);
                toast({ title: "Módulo criado com sucesso" });
              } catch {
                toast({ title: "Erro ao criar módulo", variant: "destructive" });
              } finally {
                setSavingModule(false);
              }
            }}>
              {savingModule ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Módulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
