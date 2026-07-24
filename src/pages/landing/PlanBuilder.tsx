import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Boxes, Check, ArrowRight, ArrowLeft, Loader2, Sparkles,
  MessageCircle, Package, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink, trackWhatsAppClick, getUtmParams } from "@/lib/tracking";
import { computeSetup, resolveSetupInput } from "@/lib/pricing/setup";
import type { OrgSetupDefaults, SystemSetupPricing } from "@/lib/pricing/types";
import { formatCurrency } from "@/lib/utils";

type CatalogSystem = {
  id: string; name: string; description: string | null; sale_value: number;
  setup_override: boolean; setup_cost_per_km: number; setup_daily_rate: number;
  setup_default_days: number; setup_base_fee: number;
};
type CatalogPlanItem = { module_id: string; name: string; suggested_value: number };
type CatalogPlan = {
  id: string; name: string; description: string | null;
  min_total_value: number; allow_bonus: boolean; system_id: string | null;
  items: CatalogPlanItem[];
};
type CatalogModule = {
  id: string; name: string; description: string | null;
  sale_value: number; system_ids: string[]; is_global: boolean;
};
type Catalog = {
  systems: CatalogSystem[]; plans: CatalogPlan[]; modules: CatalogModule[];
  setupDefaults: OrgSetupDefaults | null;
};

interface Props { waNumber: string }

export default function PlanBuilder({ waNumber }: Props) {
  const [step, setStep] = useState(1);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemId, setSystemId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [extras, setExtras] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ nome: "", empresa: "", telefone: "", email: "", obs: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("landing-catalog");
        if (error) throw error;
        setCatalog(data as Catalog);
      } catch (e: any) {
        toast.error("Não foi possível carregar o catálogo", { description: e?.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const system = useMemo(
    () => catalog?.systems.find((s) => s.id === systemId) ?? null,
    [catalog, systemId],
  );

  const plansForSystem = useMemo(() => {
    if (!catalog || !systemId) return [];
    return catalog.plans.filter((p) => p.system_id === systemId);
  }, [catalog, systemId]);

  const plan = useMemo(
    () => plansForSystem.find((p) => p.id === planId) ?? null,
    [plansForSystem, planId],
  );

  const extraModules = useMemo(() => {
    if (!catalog || !systemId || !plan) return [];
    const included = new Set(plan.items.map((i) => i.module_id));
    return catalog.modules.filter(
      (m) => !included.has(m.id) && (m.is_global || (m.system_ids ?? []).includes(systemId)),
    );
  }, [catalog, systemId, plan]);

  const setupEstimate = useMemo(() => {
    if (!system) return null;
    const orgDefaults: OrgSetupDefaults = catalog?.setupDefaults ?? {
      costPerKm: 0, dailyRate: 0, defaultDays: 0,
    };
    const sysPricing: SystemSetupPricing = {
      systemId: system.id,
      systemName: system.name,
      override: system.setup_override,
      costPerKm: system.setup_cost_per_km,
      dailyRate: system.setup_daily_rate,
      defaultDays: system.setup_default_days,
      baseFee: system.setup_base_fee,
    };
    // Landing público: distância desconhecida → estimativa a partir de (dias × diária + taxa fixa do sistema).
    const resolved = resolveSetupInput({ distanceKm: 0 }, sysPricing, orgDefaults);
    return computeSetup(resolved);
  }, [system, catalog]);

  const totals = useMemo(() => {
    if (!plan) return { month: 0, setup: 0 };
    let month = plan.min_total_value;
    extras.forEach((id) => {
      const m = catalog?.modules.find((x) => x.id === id);
      if (m) month += Number(m.sale_value);
    });
    return { month, setup: setupEstimate?.total ?? 0 };
  }, [plan, extras, catalog, setupEstimate]);

  const pickSystem = (id: string) => {
    setSystemId(id);
    setPlanId(null);
    setExtras(new Set());
    setStep(2);
  };

  const pickPlan = (id: string) => {
    setPlanId(id);
    setExtras(new Set());
    setStep(3);
  };

  const toggleExtra = (id: string) => {
    setExtras((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const canSubmit = form.nome.trim().length >= 2 && form.telefone.replace(/\D/g, "").length >= 10;

  const handleSubmit = async () => {
    if (!system || !plan) return;
    if (!canSubmit) { toast.error("Informe nome e telefone válidos."); return; }
    setSending(true);
    try {
      const extrasPayload = Array.from(extras).map((id) => {
        const m = catalog!.modules.find((x) => x.id === id)!;
        return { id: m.id, label: m.name, priceMonth: Number(m.sale_value), setup: 0 };
      });
      const includedPayload = plan.items.map((i) => ({
        id: i.module_id, label: i.name, priceMonth: i.suggested_value, setup: 0,
      }));
      const modulesPayload = [...includedPayload, ...extrasPayload];
      const utm = getUtmParams();
      const { error } = await supabase.from("landing_plan_leads").insert({
        segment: `${system.name} — ${plan.name}`,
        modules: modulesPayload,
        monthly_total: totals.month,
        setup_total: totals.setup,
        contact_name: form.nome.trim(),
        contact_company: form.empresa.trim() || null,
        contact_phone: form.telefone.replace(/\D/g, ""),
        contact_email: form.email.trim() || null,
        observacoes: form.obs.trim() || null,
        utm: utm as any,
      });
      if (error) throw error;

      const setupLine = totals.setup > 0
        ? `• Implantação estimada (a partir de): ${formatCurrency(totals.setup)}`
        : "";
      const linhas = [
        `Olá! Montei um plano no site da Hyon:`,
        `• Sistema: ${system.name}`,
        `• Plano: ${plan.name}`,
        `• Módulos: ${modulesPayload.map((m) => m.label).join(", ") || "Nenhum extra"}`,
        setupLine,
        `• Gostaria de receber uma proposta personalizada.`,
        ``,
        `Meus dados: ${form.nome}${form.empresa ? " — " + form.empresa : ""} | ${form.telefone}${form.email ? " | " + form.email : ""}`,
        form.obs ? `Obs: ${form.obs}` : "",
      ].filter(Boolean).join("\n");

      trackWhatsAppClick("plan_builder", {
        sistema: system.name, plano: plan.name, extras: extras.size, monthly: totals.month,
      });
      const url = buildWhatsAppLink({ phone: `55${waNumber}`, message: linhas, source: "plan_builder" });
      setDone(true);
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Proposta enviada! Abrimos o WhatsApp para você.");
    } catch (e: any) {
      toast.error("Não foi possível enviar", { description: e?.message ?? "Tente novamente." });
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setStep(1); setSystemId(null); setPlanId(null); setExtras(new Set());
    setForm({ nome: "", empresa: "", telefone: "", email: "", obs: "" });
    setDone(false);
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-16 grid place-items-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!catalog || catalog.systems.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-10 text-center">
        <p className="text-slate-300">Catálogo indisponível no momento. Entre em contato pelo WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 sm:p-10 shadow-[0_30px_80px_-30px_rgba(6,182,212,0.35)]">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
        {[
          { n: 1, label: "Sistema" },
          { n: 2, label: "Plano" },
          { n: 3, label: "Finalizar" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-2 ${step >= s.n ? "text-white" : "text-slate-500"}`}>
              <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold border transition-all ${
                step > s.n ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                : step === s.n ? "bg-gradient-to-br from-[#2563EB] to-[#7C3AED] border-transparent text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]"
                : "border-white/15 bg-white/[0.03]"
              }`}>
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < 2 && <div className={`w-8 sm:w-16 h-px ${step > s.n ? "bg-emerald-400/50" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 — Sistema */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold">Qual sistema atende seu negócio?</h3>
              <p className="text-slate-400 mt-1 text-sm">Cada sistema tem planos e módulos otimizados para o seu segmento.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {catalog.systems.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => pickSystem(s.id)}
                  className="group relative p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-white/[0.06] hover:-translate-y-1 transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2563EB]/25 to-[#06B6D4]/25 border border-white/10 grid place-items-center mb-3 group-hover:from-cyan-500/40 group-hover:to-violet-500/40 transition-all">
                    <Store className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div className="font-semibold text-white">{s.name}</div>
                  {s.description && (
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">{s.description}</div>
                  )}
                  <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Plano */}
        {step === 2 && system && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-cyan-300 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Sistema: {system.name}</div>
                <h3 className="text-2xl font-bold mt-1">Escolha o plano ideal</h3>
                <p className="text-slate-400 text-sm mt-1">Cada plano inclui um conjunto de módulos pensado para o seu perfil.</p>
              </div>
              <button onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Trocar sistema
              </button>
            </div>

            {plansForSystem.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <Package className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-300">Ainda não há planos publicados para este sistema.</p>
                <p className="text-xs text-slate-500 mt-1">Fale com nosso time no WhatsApp para uma proposta sob medida.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plansForSystem.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => pickPlan(p.id)}
                    className="text-left p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-white/[0.06] transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-cyan-300" />
                      <div className="font-semibold text-white">{p.name}</div>
                    </div>
                    {p.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{p.description}</p>}
                    <div className="text-xs text-slate-500 mb-1">Inclui {p.items.length} {p.items.length === 1 ? "módulo" : "módulos"}</div>
                    <ul className="space-y-1 mb-3">
                      {p.items.slice(0, 4).map((i) => (
                        <li key={i.module_id} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> {i.name}
                        </li>
                      ))}
                      {p.items.length > 4 && (
                        <li className="text-xs text-slate-500 pl-4">+ {p.items.length - 4} outros</li>
                      )}
                    </ul>
                    <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                      <span className="text-[11px] uppercase tracking-widest text-slate-400">A partir de</span>
                      <span className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                        Sob consulta
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-cyan-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Escolher plano <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3 — Extras + contato */}
        {step === 3 && system && plan && !done && (
          <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> {system.name} · {plan.name}
                </div>
                <h3 className="text-2xl font-bold mt-1">Quase lá! Adicione extras e envie</h3>
                <p className="text-slate-400 text-sm mt-1">Você pode acrescentar módulos opcionais compatíveis com o sistema.</p>
              </div>
              <button onClick={() => setStep(2)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Trocar plano
              </button>
            </div>

            <div className="grid lg:grid-cols-[1fr_340px] gap-6">
              <div className="space-y-5">
                {extraModules.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                      <Boxes className="w-3 h-3" /> Módulos opcionais
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {extraModules.map((m) => {
                        const active = extras.has(m.id);
                        return (
                          <button
                            key={m.id}
                            onClick={() => toggleExtra(m.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              active
                                ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 to-violet-500/5"
                                : "border-white/10 bg-white/[0.02] hover:border-white/25"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-4 h-4 mt-0.5 rounded border grid place-items-center shrink-0 ${
                                active ? "bg-cyan-400 border-cyan-400" : "border-white/25"
                              }`}>
                                {active && <Check className="w-3 h-3 text-slate-900" />}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-white text-sm">{m.name}</div>
                                {m.description && (
                                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{m.description}</div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300 text-xs uppercase tracking-widest">Nome *</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" className="bg-white/[0.03] border-white/10 mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs uppercase tracking-widest">Empresa</Label>
                    <Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} placeholder="Nome do estabelecimento" className="bg-white/[0.03] border-white/10 mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs uppercase tracking-widest">WhatsApp *</Label>
                    <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(73) 99999-9999" className="bg-white/[0.03] border-white/10 mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs uppercase tracking-widest">E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@exemplo.com" className="bg-white/[0.03] border-white/10 mt-1.5" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-slate-300 text-xs uppercase tracking-widest">Observações</Label>
                    <Textarea value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Ex.: preciso de treinamento presencial, tenho 2 lojas..." className="bg-white/[0.03] border-white/10 mt-1.5" rows={3} />
                  </div>
                </div>
              </div>

              <aside className="lg:sticky lg:top-6 h-fit p-5 rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-cyan-500/10 to-violet-500/5 backdrop-blur-md">
                <div className="text-xs uppercase tracking-widest text-cyan-300">Resumo da proposta</div>
                <div className="mt-3 space-y-1 text-sm">
                  <div><span className="text-slate-400">Sistema:</span> <span className="text-white font-medium">{system.name}</span></div>
                  <div><span className="text-slate-400">Plano:</span> <span className="text-white font-medium">{plan.name}</span></div>
                </div>
                <div className="mt-3 pb-3 border-b border-white/10">
                  <div className="text-slate-400 text-xs pt-1">Inclusos:</div>
                  <ul className="space-y-1 mt-1.5">
                    {plan.items.map((i) => (
                      <li key={i.module_id} className="flex items-start gap-2 text-slate-200 text-xs">
                        <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> {i.name}
                      </li>
                    ))}
                    {Array.from(extras).map((id) => {
                      const m = catalog.modules.find((x) => x.id === id)!;
                      return (
                        <li key={id} className="flex items-start gap-2 text-cyan-200 text-xs">
                          <Check className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" /> {m.name} <span className="text-[10px] text-slate-500">(extra)</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-slate-300">Investimento</div>
                  <div className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent mt-1">
                    Sob consulta
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Enviaremos a proposta detalhada pelo WhatsApp.</p>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={sending || !canSubmit}
                  className="w-full mt-5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)]"
                >
                  {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                    : <><MessageCircle className="w-4 h-4 mr-2" /> Enviar pelo WhatsApp</>}
                </Button>
              </aside>
            </div>
          </motion.div>
        )}

        {/* SUCESSO */}
        {done && system && plan && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 grid place-items-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
              <Check className="w-8 h-8 text-emerald-300" />
            </div>
            <h3 className="text-2xl font-bold mt-4">Proposta enviada com sucesso!</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">
              Recebemos sua solicitação para <b className="text-white">{system.name} — {plan.name}</b>. Nosso time entrará em contato pelo WhatsApp em instantes.
            </p>
            <Button onClick={reset} variant="outline" className="mt-6 border-white/15 bg-white/[0.03] hover:bg-white/[0.08]">
              Montar outro plano
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
