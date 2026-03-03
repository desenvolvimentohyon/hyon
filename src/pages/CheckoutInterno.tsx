import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, CheckCircle, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { maskDocument } from "@/lib/cnpjUtils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface System { id: string; name: string; sale_value: number }
interface Plan { id: string; name: string; discount_percent: number }

export default function CheckoutInterno() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [systems, setSystems] = useState<System[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Selections
  const [selectedSystemId, setSelectedSystemId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [customDiscount, setCustomDiscount] = useState(0);

  // Client data
  const [clientName, setClientName] = useState("");
  const [clientDoc, setClientDoc] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [{ data: sys }, { data: pln }] = await Promise.all([
      supabase.from("systems_catalog").select("id, name, sale_value").eq("active", true),
      supabase.from("plans").select("id, name, discount_percent").eq("active", true),
    ]);
    setSystems(sys || []);
    setPlans(pln || []);
    setLoading(false);
  };

  const selectedSystem = systems.find(s => s.id === selectedSystemId);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const baseValue = selectedSystem?.sale_value || 0;
  const planDiscount = selectedPlan?.discount_percent || 0;
  const totalDiscount = Math.min(100, planDiscount + customDiscount);
  const finalValue = baseValue * (1 - totalDiscount / 100);

  const steps = ["Sistema", "Plano", "Desconto", "Cliente", "Resumo"];

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedSystemId;
      case 1: return !!selectedPlanId;
      case 2: return true;
      case 3: return clientName.trim().length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: profile } = await supabase.from("profiles").select("org_id").limit(1).single();
      if (!profile) throw new Error("Perfil não encontrado");
      const orgId = profile.org_id;

      // 1. Create client
      const { data: client, error: clientErr } = await supabase.from("clients").insert({
        org_id: orgId,
        name: clientName.trim(),
        document: clientDoc || null,
        email: clientEmail || null,
        phone: clientPhone || null,
        city: clientCity || null,
        system_name: selectedSystem?.name || null,
        plan_id: selectedPlanId || null,
        monthly_value_base: baseValue,
        monthly_value_final: finalValue,
        status: "ativo",
        recurrence_active: true,
        contract_signed_at: new Date().toISOString().split("T")[0],
      }).select("id").single();

      if (clientErr || !client) throw clientErr;

      // 2. Create proposal
      const proposalNumber = `PROP-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from("proposals").insert({
        org_id: orgId,
        proposal_number: proposalNumber,
        client_id: client.id,
        client_name_snapshot: clientName.trim(),
        system_name: selectedSystem?.name || null,
        plan_name: selectedPlan?.name || null,
        monthly_value: finalValue,
        implementation_value: 0,
        acceptance_status: "aceitou",
        view_status: "aceito",
      });

      // 3. Create first financial title
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await supabase.from("financial_titles").insert({
        org_id: orgId,
        type: "receber",
        origin: "mensalidade",
        client_id: client.id,
        description: `Mensalidade ${selectedSystem?.name || ""} - ${clientName.trim()}`,
        value_original: finalValue,
        value_final: finalValue,
        due_at: dueDate.toISOString().split("T")[0],
        status: "aberto",
        competency: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`,
      });

      toast.success("Venda concluída! Cliente, proposta e mensalidade criados.");
      // Reset
      setStep(0);
      setSelectedSystemId("");
      setSelectedPlanId("");
      setCustomDiscount(0);
      setClientName("");
      setClientDoc("");
      setClientEmail("");
      setClientPhone("");
      setClientCity("");
    } catch (err: any) {
      toast.error("Erro ao finalizar: " + (err?.message || "Erro desconhecido"));
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-6"><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-6 w-6" /> Checkout Interno</h1>
        <p className="text-muted-foreground text-sm">Fluxo guiado para nova venda</p>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <Badge variant={i === step ? "default" : i < step ? "secondary" : "outline"} className="text-xs">
              {i < step ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
              {i + 1}. {s}
            </Badge>
            {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Step 0: Sistema */}
          {step === 0 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Selecione o Sistema</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {systems.map(s => (
                  <Card
                    key={s.id}
                    className={`cursor-pointer transition-all ${selectedSystemId === s.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    onClick={() => setSelectedSystemId(s.id)}
                  >
                    <CardContent className="pt-4">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{fmt(s.sale_value)}/mês</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Plano */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Selecione o Plano</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plans.map(p => (
                  <Card
                    key={p.id}
                    className={`cursor-pointer transition-all ${selectedPlanId === p.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    onClick={() => setSelectedPlanId(p.id)}
                  >
                    <CardContent className="pt-4">
                      <p className="font-medium">{p.name}</p>
                      {p.discount_percent > 0 && <Badge variant="secondary" className="text-xs mt-1">{p.discount_percent}% desc.</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Desconto */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Desconto Adicional</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Base</Label>
                  <p className="text-lg font-bold">{fmt(baseValue)}</p>
                </div>
                <div>
                  <Label>Desconto do Plano</Label>
                  <p className="text-lg font-bold">{planDiscount}%</p>
                </div>
              </div>
              <div>
                <Label>Desconto Adicional (%)</Label>
                <Input type="number" min={0} max={100 - planDiscount} value={customDiscount} onChange={e => setCustomDiscount(Number(e.target.value) || 0)} />
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Valor Final</span>
                <span className="text-2xl font-bold text-primary">{fmt(finalValue)}/mês</span>
              </div>
            </div>
          )}

          {/* Step 3: Cliente */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Dados do Cliente</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nome *</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} /></div>
                <div><Label>Documento (CPF/CNPJ)</Label><Input value={clientDoc} onChange={e => setClientDoc(maskDocument(e.target.value))} placeholder="000.000.000-00" /></div>
                <div><Label>Email</Label><Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} /></div>
                <div><Label>Telefone</Label><Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} /></div>
                <div><Label>Cidade</Label><Input value={clientCity} onChange={e => setClientCity(e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* Step 4: Resumo */}
          {step === 4 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Resumo da Venda</Label>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Sistema:</span> <span className="font-medium">{selectedSystem?.name}</span></div>
                <div><span className="text-muted-foreground">Plano:</span> <span className="font-medium">{selectedPlan?.name}</span></div>
                <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{clientName}</span></div>
                <div><span className="text-muted-foreground">Desconto Total:</span> <span className="font-medium">{totalDiscount}%</span></div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg">Valor Mensal</span>
                <span className="text-3xl font-bold text-primary">{fmt(finalValue)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Ao confirmar, será criado: cliente, proposta aceita e primeira mensalidade (vencimento em 30 dias).</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Processando..." : "Confirmar Venda"}
            <CheckCircle className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
