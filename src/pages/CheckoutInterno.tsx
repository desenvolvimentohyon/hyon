import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, CheckCircle, ShoppingCart, SkipForward } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { maskDocument } from "@/lib/cnpjUtils";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface System { id: string; name: string; sale_value: number }
interface Plan { id: string; name: string; discount_percent: number }
interface Module { id: string; name: string; sale_value: number; system_id: string | null; is_global: boolean }
interface Region { id: string; name: string; base_value: number; additional_fee: number }
interface CompanyImpl { impl_cost_per_km: number; impl_daily_rate: number }

export default function CheckoutInterno() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [systems, setSystems] = useState<System[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [companyImpl, setCompanyImpl] = useState<CompanyImpl>({ impl_cost_per_km: 0, impl_daily_rate: 0 });

  // Selections
  const [selectedSystemId, setSelectedSystemId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedModules, setSelectedModules] = useState<Map<string, number>>(new Map());
  const [customDiscount, setCustomDiscount] = useState(0);

  // Implantação
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [chargeKm, setChargeKm] = useState(false);
  const [chargeDiary, setChargeDiary] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [diaryDays, setDiaryDays] = useState(0);

  // Client data
  const [clientName, setClientName] = useState("");
  const [clientDoc, setClientDoc] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [{ data: sys }, { data: pln }, { data: mods }, { data: regs }, { data: cp }] = await Promise.all([
      supabase.from("systems_catalog").select("id, name, sale_value").eq("active", true),
      supabase.from("plans").select("id, name, discount_percent").eq("active", true),
      supabase.from("system_modules").select("id, name, sale_value, system_id, is_global").eq("active", true),
      supabase.from("deployment_regions").select("id, name, base_value, additional_fee").eq("active", true),
      supabase.from("company_profile").select("impl_cost_per_km, impl_daily_rate").limit(1).single(),
    ]);
    setSystems(sys || []);
    setPlans(pln || []);
    setAllModules(mods || []);
    setRegions(regs || []);
    if (cp) setCompanyImpl(cp);
    setLoading(false);
  };

  // Filtered modules for selected system
  const filteredModules = useMemo(() =>
    allModules.filter(m => m.system_id === selectedSystemId || m.is_global),
    [allModules, selectedSystemId]
  );

  const selectedSystem = systems.find(s => s.id === selectedSystemId);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedRegion = regions.find(r => r.id === selectedRegionId);

  // Base value = sum of selected modules
  const baseValue = useMemo(() => {
    let total = 0;
    selectedModules.forEach((qty, modId) => {
      const mod = allModules.find(m => m.id === modId);
      if (mod) total += mod.sale_value * qty;
    });
    return total;
  }, [selectedModules, allModules]);

  const planDiscount = selectedPlan?.discount_percent || 0;
  const totalDiscount = Math.min(100, planDiscount + customDiscount);
  const finalValue = baseValue * (1 - totalDiscount / 100);

  // Implantation value
  const implValue = useMemo(() => {
    if (!selectedRegion) return 0;
    let total = selectedRegion.base_value + selectedRegion.additional_fee;
    if (chargeKm) total += distanceKm * companyImpl.impl_cost_per_km;
    if (chargeDiary) total += diaryDays * companyImpl.impl_daily_rate;
    return total;
  }, [selectedRegion, chargeKm, chargeDiary, distanceKm, diaryDays, companyImpl]);

  const steps = ["Sistema", "Módulos", "Plano", "Implantação", "Desconto", "Cliente", "Resumo"];

  const toggleModule = (modId: string) => {
    setSelectedModules(prev => {
      const next = new Map(prev);
      if (next.has(modId)) next.delete(modId); else next.set(modId, 1);
      return next;
    });
  };

  const setModuleQty = (modId: string, qty: number) => {
    setSelectedModules(prev => {
      const next = new Map(prev);
      next.set(modId, Math.max(1, qty));
      return next;
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedSystemId;
      case 1: return selectedModules.size > 0;
      case 2: return !!selectedPlanId;
      case 3: return true; // can skip
      case 4: return true;
      case 5: return clientName.trim().length > 0;
      case 6: return true;
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

      // 2. Create client_modules
      const moduleInserts = Array.from(selectedModules.entries()).map(([modId, qty]) => ({
        org_id: orgId,
        client_id: client.id,
        module_id: modId,
        quantity: qty,
      }));
      if (moduleInserts.length > 0) {
        await supabase.from("client_modules").insert(moduleInserts);
      }

      // 3. Create proposal
      const proposalNumber = `PROP-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from("proposals").insert({
        org_id: orgId,
        proposal_number: proposalNumber,
        client_id: client.id,
        client_name_snapshot: clientName.trim(),
        system_name: selectedSystem?.name || null,
        plan_name: selectedPlan?.name || null,
        monthly_value: finalValue,
        implementation_value: implValue,
        acceptance_status: "aceitou",
        view_status: "aceito",
      });

      // 4. Create first mensalidade
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

      // 5. Create implantação title if applicable
      if (implValue > 0) {
        const implDue = new Date();
        implDue.setDate(implDue.getDate() + 15);
        await supabase.from("financial_titles").insert({
          org_id: orgId,
          type: "receber",
          origin: "implantacao",
          client_id: client.id,
          description: `Implantação ${selectedSystem?.name || ""} - ${clientName.trim()}${selectedRegion ? ` (${selectedRegion.name})` : ""}`,
          value_original: implValue,
          value_final: implValue,
          due_at: implDue.toISOString().split("T")[0],
          status: "aberto",
          competency: `${implDue.getFullYear()}-${String(implDue.getMonth() + 1).padStart(2, "0")}`,
        });
      }

      toast.success("Venda concluída! Cliente, proposta e títulos criados.");
      // Reset
      setStep(0);
      setSelectedSystemId("");
      setSelectedPlanId("");
      setSelectedModules(new Map());
      setCustomDiscount(0);
      setSelectedRegionId("");
      setChargeKm(false);
      setChargeDiary(false);
      setDistanceKm(0);
      setDiaryDays(0);
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
      <ModuleNavGrid moduleId="clientes" />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-6 w-6" /> Checkout Interno</h1>
        <p className="text-muted-foreground text-sm">Fluxo guiado para nova venda</p>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-1 items-center flex-wrap">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
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
                    onClick={() => { setSelectedSystemId(s.id); setSelectedModules(new Map()); }}
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

          {/* Step 1: Módulos */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Selecione os Módulos</Label>
              <p className="text-sm text-muted-foreground">Marque os módulos desejados e defina a quantidade</p>
              {filteredModules.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum módulo disponível para este sistema.</p>
              ) : (
                <div className="space-y-2">
                  {filteredModules.map(m => {
                    const isSelected = selectedModules.has(m.id);
                    const qty = selectedModules.get(m.id) || 1;
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleModule(m.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{fmt(m.sale_value)}/mês</p>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Qtd:</Label>
                            <Input
                              type="number"
                              min={1}
                              value={qty}
                              onChange={e => setModuleQty(m.id, Number(e.target.value) || 1)}
                              className="w-16 h-8 text-center text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Valor Base (módulos)</span>
                <span className="text-xl font-bold text-primary">{fmt(baseValue)}/mês</span>
              </div>
            </div>
          )}

          {/* Step 2: Plano */}
          {step === 2 && (
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

          {/* Step 3: Implantação */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Implantação</Label>
              <p className="text-sm text-muted-foreground">Selecione a região e defina os custos de implantação (opcional)</p>

              {regions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma região cadastrada.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {regions.map(r => (
                    <Card
                      key={r.id}
                      className={`cursor-pointer transition-all ${selectedRegionId === r.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                      onClick={() => setSelectedRegionId(r.id)}
                    >
                      <CardContent className="pt-4">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">Base: {fmt(r.base_value)}{r.additional_fee > 0 ? ` + ${fmt(r.additional_fee)} taxa` : ""}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedRegion && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={chargeKm} onCheckedChange={(v) => setChargeKm(!!v)} />
                    <Label className="text-sm">Cobrar deslocamento (KM)</Label>
                    {chargeKm && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={distanceKm || ""}
                          onChange={e => setDistanceKm(Number(e.target.value) || 0)}
                          className="w-20 h-8 text-sm"
                          placeholder="KM"
                        />
                        <span className="text-xs text-muted-foreground">× {fmt(companyImpl.impl_cost_per_km)}/km</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={chargeDiary} onCheckedChange={(v) => setChargeDiary(!!v)} />
                    <Label className="text-sm">Cobrar diária</Label>
                    {chargeDiary && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={diaryDays || ""}
                          onChange={e => setDiaryDays(Number(e.target.value) || 0)}
                          className="w-20 h-8 text-sm"
                          placeholder="Dias"
                        />
                        <span className="text-xs text-muted-foreground">× {fmt(companyImpl.impl_daily_rate)}/dia</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Valor da Implantação</span>
                    <span className="text-xl font-bold text-primary">{fmt(implValue)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Desconto */}
          {step === 4 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Desconto Adicional</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Base (módulos)</Label>
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
                <span className="text-muted-foreground">Valor Final Mensal</span>
                <span className="text-2xl font-bold text-primary">{fmt(finalValue)}/mês</span>
              </div>
            </div>
          )}

          {/* Step 5: Cliente */}
          {step === 5 && (
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

          {/* Step 6: Resumo */}
          {step === 6 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Resumo da Venda</Label>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Sistema:</span> <span className="font-medium">{selectedSystem?.name}</span></div>
                <div><span className="text-muted-foreground">Plano:</span> <span className="font-medium">{selectedPlan?.name}</span></div>
                <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{clientName}</span></div>
                <div><span className="text-muted-foreground">Desconto Total:</span> <span className="font-medium">{totalDiscount}%</span></div>
              </div>

              {/* Módulos selecionados */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Módulos:</p>
                {Array.from(selectedModules.entries()).map(([modId, qty]) => {
                  const mod = allModules.find(m => m.id === modId);
                  if (!mod) return null;
                  return (
                    <div key={modId} className="flex justify-between text-sm pl-2">
                      <span>{mod.name} {qty > 1 ? `(×${qty})` : ""}</span>
                      <span className="font-medium">{fmt(mod.sale_value * qty)}/mês</span>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span>Valor Mensal</span>
                <span className="text-2xl font-bold text-primary">{fmt(finalValue)}</span>
              </div>

              {implValue > 0 && (
                <div className="flex justify-between items-center">
                  <span>Implantação{selectedRegion ? ` (${selectedRegion.name})` : ""}</span>
                  <span className="text-xl font-bold text-primary">{fmt(implValue)}</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">Ao confirmar, será criado: cliente, proposta aceita, módulos vinculados{implValue > 0 ? ", título de implantação" : ""} e primeira mensalidade (vencimento em 30 dias).</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex gap-2">
          {step === 3 && !selectedRegionId && (
            <Button variant="ghost" onClick={() => setStep(s => s + 1)}>
              Pular <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step < 6 ? (
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
    </div>
  );
}
