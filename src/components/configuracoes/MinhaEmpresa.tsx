import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Building2, MapPin, FileText, Landmark, Palette, Settings2,
  Copy, Plus, Trash2, Star, Loader2, Upload, AlertTriangle
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

type CompanyProfile = {
  id?: string;
  org_id?: string;
  legal_name: string | null;
  trade_name: string | null;
  cnpj: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_uf: string | null;
  tax_regime: string | null;
  cnae: string | null;
  csc_code: string | null;
  certificate_expiration: string | null;
  certificate_number: string | null;
  fiscal_notes: string | null;
  logo_path: string | null;
  logo_dark_path: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  footer_text: string | null;
  institutional_text: string | null;
  default_due_day: number | null;
  proposal_validity_days: number | null;
  default_late_fee_percent: number | null;
  default_interest_percent: number | null;
  partner_commission_days: number | null;
  default_billing_message: string | null;
  default_proposal_message: string | null;
};

type BankAccount = {
  id?: string;
  org_id?: string;
  bank_name: string;
  bank_code: string | null;
  agency: string | null;
  account: string | null;
  account_type: string;
  pix_key: string | null;
  holder_name: string | null;
  holder_document: string | null;
  is_default: boolean;
};

const emptyProfile: CompanyProfile = {
  legal_name: null, trade_name: null, cnpj: null, state_registration: null,
  municipal_registration: null, phone: null, whatsapp: null, email: null, website: null,
  address_cep: null, address_street: null, address_number: null, address_complement: null,
  address_neighborhood: null, address_city: null, address_uf: null,
  tax_regime: null, cnae: null, csc_code: null, certificate_expiration: null,
  certificate_number: null, fiscal_notes: null,
  logo_path: null, logo_dark_path: null, primary_color: "#3b82f6", secondary_color: "#10b981",
  footer_text: null, institutional_text: null,
  default_due_day: 10, proposal_validity_days: 15, default_late_fee_percent: 2,
  default_interest_percent: 1, partner_commission_days: 7,
  default_billing_message: null, default_proposal_message: null,
};

const emptyBank: BankAccount = {
  bank_name: "", bank_code: null, agency: null, account: null,
  account_type: "corrente", pix_key: null, holder_name: null, holder_document: null, is_default: false,
};

export default function MinhaEmpresa() {
  const { profile: authProfile } = useAuth();
  const orgId = authProfile?.org_id;
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CompanyProfile>(emptyProfile);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDarkUploading, setLogoDarkUploading] = useState(false);

  // Fetch company profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["company-profile", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_profile")
        .select("*")
        .eq("org_id", orgId!)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  // Fetch bank accounts
  const { data: banksData } = useQuery({
    queryKey: ["company-bank-accounts", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_bank_accounts")
        .select("*")
        .eq("org_id", orgId!)
        .order("is_default", { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  useEffect(() => {
    if (profileData) {
      setForm({ ...emptyProfile, ...profileData });
    }
  }, [profileData]);

  useEffect(() => {
    if (banksData) setBanks(banksData as any);
  }, [banksData]);

  const set = useCallback((key: keyof CompanyProfile, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  // Save profile
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form, org_id: orgId };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      if (profileData?.id) {
        const { error } = await supabase
          .from("company_profile")
          .update(payload)
          .eq("id", profileData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_profile")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      toast({ title: "Dados da empresa salvos!" });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  // CNPJ lookup
  const lookupCnpj = async () => {
    const raw = form.cnpj?.replace(/\D/g, "");
    if (!raw || raw.length !== 14) return;
    setCnpjLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cnpj-lookup", { body: { cnpj: raw } });
      if (error) throw error;
      if (data) {
        setForm(prev => ({
          ...prev,
          legal_name: data.razao_social || prev.legal_name,
          trade_name: data.nome_fantasia || prev.trade_name,
          phone: data.telefone || prev.phone,
          email: data.email || prev.email,
          address_cep: data.cep || prev.address_cep,
          address_street: data.logradouro || prev.address_street,
          address_number: data.numero || prev.address_number,
          address_complement: data.complemento || prev.address_complement,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.municipio || prev.address_city,
          address_uf: data.uf || prev.address_uf,
          cnae: data.cnae_fiscal?.toString() || prev.cnae,
        }));
        toast({ title: "Dados do CNPJ carregados!" });
      }
    } catch {
      toast({ title: "Erro ao buscar CNPJ", variant: "destructive" });
    }
    setCnpjLoading(false);
  };

  // CEP lookup
  const lookupCep = async () => {
    const raw = form.address_cep?.replace(/\D/g, "");
    if (!raw || raw.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          address_street: data.logradouro || prev.address_street,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.localidade || prev.address_city,
          address_uf: data.uf || prev.address_uf,
        }));
      }
    } catch { /* ignore */ }
    setCepLoading(false);
  };

  // Logo upload helper
  const uploadLogo = async (file: File, field: "logo_path" | "logo_dark_path") => {
    const setter = field === "logo_path" ? setLogoUploading : setLogoDarkUploading;
    setter(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/${field}.${ext}`;
      const { error } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(path);
      set(field, urlData.publicUrl);
      toast({ title: "Logo enviado!" });
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    }
    setter(false);
  };

  // Bank account CRUD
  const saveBank = async (bank: BankAccount) => {
    const payload: any = { ...bank, org_id: orgId };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    if (bank.id) {
      const { error } = await supabase.from("company_bank_accounts").update(payload).eq("id", bank.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("company_bank_accounts").insert(payload);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }
    queryClient.invalidateQueries({ queryKey: ["company-bank-accounts"] });
    setEditingBank(null);
    toast({ title: "Conta bancária salva!" });
  };

  const deleteBank = async (id: string) => {
    await supabase.from("company_bank_accounts").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["company-bank-accounts"] });
    toast({ title: "Conta removida!" });
  };

  const setDefaultBank = async (id: string) => {
    // Unset all, then set selected
    for (const b of banks) {
      if (b.id && b.is_default) {
        await supabase.from("company_bank_accounts").update({ is_default: false }).eq("id", b.id);
      }
    }
    await supabase.from("company_bank_accounts").update({ is_default: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["company-bank-accounts"] });
    toast({ title: "Conta padrão definida!" });
  };

  // Certificate alert
  const certDaysLeft = form.certificate_expiration
    ? differenceInDays(parseISO(form.certificate_expiration), new Date())
    : null;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="dados" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" />Dados Gerais</TabsTrigger>
          <TabsTrigger value="endereco" className="gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5" />Endereço</TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Fiscal</TabsTrigger>
          <TabsTrigger value="bancario" className="gap-1.5 text-xs"><Landmark className="h-3.5 w-3.5" />Bancário</TabsTrigger>
          <TabsTrigger value="visual" className="gap-1.5 text-xs"><Palette className="h-3.5 w-3.5" />Identidade Visual</TabsTrigger>
          <TabsTrigger value="parametros" className="gap-1.5 text-xs"><Settings2 className="h-3.5 w-3.5" />Parâmetros</TabsTrigger>
        </TabsList>

        {/* DADOS GERAIS */}
        <TabsContent value="dados">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados Gerais da Empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs">CNPJ</Label>
                  <div className="flex gap-2">
                    <Input className="h-9" placeholder="00.000.000/0000-00" value={form.cnpj || ""} onChange={e => set("cnpj", e.target.value)} />
                    <Button size="sm" variant="outline" onClick={lookupCnpj} disabled={cnpjLoading} className="shrink-0">
                      {cnpjLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buscar"}
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Razão Social</Label>
                  <Input className="h-9" placeholder="Razão Social" value={form.legal_name || ""} onChange={e => set("legal_name", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Nome Fantasia</Label>
                  <Input className="h-9" placeholder="Nome Fantasia" value={form.trade_name || ""} onChange={e => set("trade_name", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Inscrição Estadual</Label>
                  <Input className="h-9" placeholder="Inscrição Estadual" value={form.state_registration || ""} onChange={e => set("state_registration", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Inscrição Municipal</Label>
                  <Input className="h-9" placeholder="Inscrição Municipal" value={form.municipal_registration || ""} onChange={e => set("municipal_registration", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input className="h-9" placeholder="(00) 0000-0000" value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">WhatsApp</Label>
                  <Input className="h-9" placeholder="(00) 00000-0000" value={form.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">E-mail Institucional</Label>
                  <Input className="h-9" type="email" placeholder="contato@empresa.com" value={form.email || ""} onChange={e => set("email", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Site</Label>
                  <Input className="h-9" placeholder="https://www.empresa.com" value={form.website || ""} onChange={e => set("website", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENDEREÇO */}
        <TabsContent value="endereco">
          <Card>
            <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">CEP</Label>
                  <div className="flex gap-2">
                    <Input className="h-9" placeholder="00000-000" value={form.address_cep || ""} onChange={e => set("address_cep", e.target.value)} />
                    <Button size="sm" variant="outline" onClick={lookupCep} disabled={cepLoading} className="shrink-0">
                      {cepLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buscar"}
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Logradouro</Label>
                  <Input className="h-9" placeholder="Rua, Avenida..." value={form.address_street || ""} onChange={e => set("address_street", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Número</Label>
                  <Input className="h-9" placeholder="Nº" value={form.address_number || ""} onChange={e => set("address_number", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Complemento</Label>
                  <Input className="h-9" placeholder="Sala, Andar..." value={form.address_complement || ""} onChange={e => set("address_complement", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Bairro</Label>
                  <Input className="h-9" placeholder="Bairro" value={form.address_neighborhood || ""} onChange={e => set("address_neighborhood", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Cidade</Label>
                  <Input className="h-9" placeholder="Cidade" value={form.address_city || ""} onChange={e => set("address_city", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">UF</Label>
                  <Input className="h-9" placeholder="UF" maxLength={2} value={form.address_uf || ""} onChange={e => set("address_uf", e.target.value.toUpperCase())} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FISCAL */}
        <TabsContent value="fiscal">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados Fiscais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {certDaysLeft !== null && certDaysLeft <= 15 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {certDaysLeft <= 0
                    ? "Certificado digital VENCIDO!"
                    : `Certificado digital vence em ${certDaysLeft} dia(s)!`}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Regime Tributário</Label>
                  <Select value={form.tax_regime || ""} onValueChange={v => set("tax_regime", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                      <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="lucro_real">Lucro Real</SelectItem>
                      <SelectItem value="mei">MEI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">CNAE Principal</Label>
                  <Input className="h-9" placeholder="0000-0/00" value={form.cnae || ""} onChange={e => set("cnae", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Código CSC</Label>
                  <div className="flex gap-2">
                    <Input className="h-9" placeholder="Código CSC" value={form.csc_code || ""} onChange={e => set("csc_code", e.target.value)} />
                    <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => {
                      if (form.csc_code) { navigator.clipboard.writeText(form.csc_code); toast({ title: "CSC copiado!" }); }
                    }}><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Vencimento do Certificado Digital</Label>
                  <Input className="h-9" type="date" value={form.certificate_expiration || ""} onChange={e => set("certificate_expiration", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Número do Certificado</Label>
                  <Input className="h-9" placeholder="Número" value={form.certificate_number || ""} onChange={e => set("certificate_number", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Observações Fiscais</Label>
                  <Textarea rows={3} placeholder="Observações internas sobre questões fiscais..." value={form.fiscal_notes || ""} onChange={e => set("fiscal_notes", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BANCÁRIO */}
        <TabsContent value="bancario">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Contas Bancárias</CardTitle>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditingBank({ ...emptyBank })}>
                  <Plus className="h-3.5 w-3.5" />Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Editing form */}
              {editingBank && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Banco</Label>
                      <Input className="h-9" placeholder="Nome do banco" value={editingBank.bank_name} onChange={e => setEditingBank({ ...editingBank, bank_name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Código do Banco</Label>
                      <Input className="h-9" placeholder="001" value={editingBank.bank_code || ""} onChange={e => setEditingBank({ ...editingBank, bank_code: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Agência</Label>
                      <Input className="h-9" placeholder="0001" value={editingBank.agency || ""} onChange={e => setEditingBank({ ...editingBank, agency: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Conta</Label>
                      <Input className="h-9" placeholder="00000-0" value={editingBank.account || ""} onChange={e => setEditingBank({ ...editingBank, account: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select value={editingBank.account_type} onValueChange={v => setEditingBank({ ...editingBank, account_type: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corrente">Corrente</SelectItem>
                          <SelectItem value="poupanca">Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Chave PIX</Label>
                      <Input className="h-9" placeholder="Chave PIX" value={editingBank.pix_key || ""} onChange={e => setEditingBank({ ...editingBank, pix_key: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Titular</Label>
                      <Input className="h-9" placeholder="Nome do titular" value={editingBank.holder_name || ""} onChange={e => setEditingBank({ ...editingBank, holder_name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Documento do Titular</Label>
                      <Input className="h-9" placeholder="CPF/CNPJ" value={editingBank.holder_document || ""} onChange={e => setEditingBank({ ...editingBank, holder_document: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditingBank(null)}>Cancelar</Button>
                    <Button size="sm" onClick={() => saveBank(editingBank)}>Salvar Conta</Button>
                  </div>
                </div>
              )}

              {/* List */}
              {banks.length === 0 && !editingBank && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conta bancária cadastrada.</p>
              )}
              {banks.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 border rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{b.bank_name}</span>
                      {b.is_default && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Padrão</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ag: {b.agency || "—"} | Conta: {b.account || "—"} | {b.account_type === "poupanca" ? "Poupança" : "Corrente"}
                      {b.pix_key && ` | PIX: ${b.pix_key}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!b.is_default && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Definir como padrão" onClick={() => setDefaultBank(b.id)}>
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingBank({ ...b })}>
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteBank(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IDENTIDADE VISUAL */}
        <TabsContent value="visual">
          <Card>
            <CardHeader><CardTitle className="text-base">Identidade Visual</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Logo Principal</Label>
                  {form.logo_path && <img src={form.logo_path} alt="Logo" className="h-16 mb-2 rounded object-contain bg-muted p-1" />}
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                    {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Enviar logo
                    <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadLogo(e.target.files[0], "logo_path"); }} />
                  </label>
                </div>
                <div>
                  <Label className="text-xs">Logo para Fundo Escuro</Label>
                  {form.logo_dark_path && <img src={form.logo_dark_path} alt="Logo dark" className="h-16 mb-2 rounded object-contain bg-zinc-800 p-1" />}
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                    {logoDarkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Enviar logo escuro
                    <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadLogo(e.target.files[0], "logo_dark_path"); }} />
                  </label>
                </div>
                <div>
                  <Label className="text-xs">Cor Primária</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.primary_color || "#3b82f6"} onChange={e => set("primary_color", e.target.value)} className="h-9 w-12 rounded cursor-pointer border-0" />
                    <Input className="h-9 flex-1" value={form.primary_color || ""} onChange={e => set("primary_color", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Cor Secundária</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.secondary_color || "#10b981"} onChange={e => set("secondary_color", e.target.value)} className="h-9 w-12 rounded cursor-pointer border-0" />
                    <Input className="h-9 flex-1" value={form.secondary_color || ""} onChange={e => set("secondary_color", e.target.value)} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Rodapé Padrão (Propostas/PDF)</Label>
                  <Input className="h-9" placeholder="Texto do rodapé" value={form.footer_text || ""} onChange={e => set("footer_text", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Texto Institucional</Label>
                  <Textarea rows={3} placeholder="Texto institucional para propostas e contratos..." value={form.institutional_text || ""} onChange={e => set("institutional_text", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PARÂMETROS OPERACIONAIS */}
        <TabsContent value="parametros">
          <Card>
            <CardHeader><CardTitle className="text-base">Parâmetros Operacionais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Dia Padrão de Vencimento</Label>
                  <Input className="h-9" type="number" min={1} max={28} value={form.default_due_day ?? 10} onChange={e => set("default_due_day", Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Validade Padrão da Proposta (dias)</Label>
                  <Input className="h-9" type="number" value={form.proposal_validity_days ?? 15} onChange={e => set("proposal_validity_days", Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Multa por Atraso (%)</Label>
                  <Input className="h-9" type="number" step="0.1" value={form.default_late_fee_percent ?? 2} onChange={e => set("default_late_fee_percent", Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Juros por Atraso (% a.m.)</Label>
                  <Input className="h-9" type="number" step="0.1" value={form.default_interest_percent ?? 1} onChange={e => set("default_interest_percent", Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Dias para Gerar Comissão do Parceiro</Label>
                  <Input className="h-9" type="number" value={form.partner_commission_days ?? 7} onChange={e => set("partner_commission_days", Number(e.target.value))} />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Mensagem Padrão de Cobrança</Label>
                  <Textarea rows={3} placeholder="Mensagem enviada ao cobrar cliente..." value={form.default_billing_message || ""} onChange={e => set("default_billing_message", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Mensagem Padrão de Proposta</Label>
                  <Textarea rows={3} placeholder="Mensagem enviada junto com a proposta..." value={form.default_proposal_message || ""} onChange={e => set("default_proposal_message", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={() => { if (profileData) setForm({ ...emptyProfile, ...profileData }); else setForm(emptyProfile); }}>
          Cancelar
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
