import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Croissant, UtensilsCrossed, Beef, Coffee, Pizza, HardHat, Beer, Shirt,
  ShoppingCart, Menu as MenuIcon, BookOpen, Boxes, ClipboardList, Users, Receipt,
  Check, ArrowRight, ArrowLeft, Loader2, Sparkles, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink, trackWhatsAppClick, getUtmParams } from "@/lib/tracking";

/* ---------- Catálogo ---------- */
export type Segment = {
  id: string; label: string; icon: typeof Store;
  basePriceMonth: number; baseSetup: number; recommended: string[];
};

export type Modulo = {
  id: string; label: string; icon: typeof Store; desc: string;
  priceMonth: number; setup: number;
};

const SEGMENTS: Segment[] = [
  { id: "mercado", label: "Mercado", icon: ShoppingCart, basePriceMonth: 149, baseSetup: 500, recommended: ["pdv","estoque","cadastros","nfe"] },
  { id: "padaria", label: "Padaria", icon: Croissant, basePriceMonth: 129, baseSetup: 450, recommended: ["pdv","ficha","estoque","nfe"] },
  { id: "lanchonete", label: "Lanchonete", icon: UtensilsCrossed, basePriceMonth: 129, baseSetup: 450, recommended: ["pdv","menu","cardapio","ficha"] },
  { id: "acougue", label: "Açougue", icon: Beef, basePriceMonth: 119, baseSetup: 400, recommended: ["pdv","estoque","nfe"] },
  { id: "cafeteria", label: "Cafeteria", icon: Coffee, basePriceMonth: 129, baseSetup: 450, recommended: ["pdv","menu","cardapio","ficha"] },
  { id: "pizzaria", label: "Pizzaria", icon: Pizza, basePriceMonth: 139, baseSetup: 500, recommended: ["pdv","menu","cardapio","ficha"] },
  { id: "construcao", label: "Material de construção", icon: HardHat, basePriceMonth: 169, baseSetup: 600, recommended: ["pdv","estoque","cadastros","nfe"] },
  { id: "bebidas", label: "Distribuidora de bebidas", icon: Beer, basePriceMonth: 179, baseSetup: 650, recommended: ["pdv","estoque","cadastros","nfe"] },
  { id: "roupas", label: "Loja de roupas", icon: Shirt, basePriceMonth: 139, baseSetup: 500, recommended: ["pdv","estoque","cadastros","nfe"] },
];

const MODULOS: Modulo[] = [
  { id: "pdv", label: "PDV (Frente de Caixa)", icon: ShoppingCart, desc: "Venda rápida, sangria, TEF integrado.", priceMonth: 89, setup: 300 },
  { id: "menu", label: "Menu Digital", icon: MenuIcon, desc: "Cardápio para totem/tablet no salão.", priceMonth: 79, setup: 200 },
  { id: "cardapio", label: "Cardápio Digital (QR Code)", icon: BookOpen, desc: "Cliente escaneia e pede pela mesa.", priceMonth: 59, setup: 150 },
  { id: "estoque", label: "Estoque", icon: Boxes, desc: "Entrada, saída, inventário, mínimos.", priceMonth: 69, setup: 250 },
  { id: "ficha", label: "Ficha Técnica", icon: ClipboardList, desc: "Composição e custo real por produto.", priceMonth: 49, setup: 150 },
  { id: "cadastros", label: "Clientes e Fornecedores", icon: Users, desc: "Base completa com histórico e limite.", priceMonth: 39, setup: 100 },
  { id: "nfe", label: "Gestão de Notas Fiscais", icon: Receipt, desc: "Emissão de NFC-e/NF-e e escrituração.", priceMonth: 99, setup: 350 },
];

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props { waNumber: string }

export default function PlanBuilder({ waNumber }: Props) {
  const [step, setStep] = useState(1);
  const [segmentId, setSegmentId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ nome: "", empresa: "", telefone: "", email: "", obs: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const segment = useMemo(() => SEGMENTS.find(s => s.id === segmentId) ?? null, [segmentId]);

  const totals = useMemo(() => {
    if (!segment) return { month: 0, setup: 0 };
    let month = segment.basePriceMonth;
    let setup = segment.baseSetup;
    selected.forEach(id => {
      const m = MODULOS.find(x => x.id === id);
      if (m) { month += m.priceMonth; setup += m.setup; }
    });
    return { month, setup };
  }, [segment, selected]);

  const toggleModule = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const pickSegment = (id: string) => {
    setSegmentId(id);
    const seg = SEGMENTS.find(s => s.id === id);
    if (seg) setSelected(new Set(seg.recommended));
    setStep(2);
  };

  const canSubmit = form.nome.trim().length >= 2 && form.telefone.replace(/\D/g, "").length >= 10;

  const handleSubmit = async () => {
    if (!segment) return;
    if (!canSubmit) { toast.error("Informe nome e telefone válidos."); return; }
    setSending(true);
    try {
      const modulesPayload = Array.from(selected).map(id => {
        const m = MODULOS.find(x => x.id === id)!;
        return { id: m.id, label: m.label, priceMonth: m.priceMonth, setup: m.setup };
      });
      const utm = getUtmParams();
      const { error } = await supabase.from("landing_plan_leads").insert({
        segment: segment.label,
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

      // Mensagem WhatsApp
      const linhas = [
        `Olá! Montei um plano no site da Hyon:`,
        `• Segmento: ${segment.label}`,
        `• Módulos: ${modulesPayload.map(m => m.label).join(", ") || "Nenhum extra"}`,
        `• Gostaria de receber uma proposta personalizada.`,

        ``,
        `Meus dados: ${form.nome}${form.empresa ? " — " + form.empresa : ""} | ${form.telefone}${form.email ? " | " + form.email : ""}`,
        form.obs ? `Obs: ${form.obs}` : "",
      ].filter(Boolean).join("\n");

      trackWhatsAppClick("plan_builder", { segmento: segment.label, modulos: modulesPayload.length, monthly: totals.month });
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
    setStep(1); setSegmentId(null); setSelected(new Set());
    setForm({ nome: "", empresa: "", telefone: "", email: "", obs: "" });
    setDone(false);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 sm:p-10 shadow-[0_30px_80px_-30px_rgba(6,182,212,0.35)]">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
        {[
          { n: 1, label: "Segmento" },
          { n: 2, label: "Módulos" },
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
        {/* STEP 1 — Segmento */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold">Qual é o segmento do seu negócio?</h3>
              <p className="text-slate-400 mt-1 text-sm">Escolha para receber uma configuração ideal para você.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SEGMENTS.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => pickSegment(s.id)}
                  className="group relative p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-white/[0.06] hover:-translate-y-1 transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2563EB]/25 to-[#06B6D4]/25 border border-white/10 grid place-items-center mb-3 group-hover:from-cyan-500/40 group-hover:to-violet-500/40 transition-all">
                    <s.icon className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div className="font-semibold text-white">{s.label}</div>
                  <div className="text-xs text-slate-400 mt-1">Solução personalizada</div>
                  <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Módulos */}
        {step === 2 && segment && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-cyan-300 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Segmento: {segment.label}</div>
                <h3 className="text-2xl font-bold mt-1">Monte o seu plano</h3>
                <p className="text-slate-400 text-sm mt-1">Já pré-selecionamos os módulos recomendados. Ajuste como preferir.</p>
              </div>
              <button onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Trocar segmento
              </button>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {MODULOS.map((m) => {
                  const active = selected.has(m.id);
                  const recomendado = segment.recommended.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleModule(m.id)}
                      className={`relative p-4 rounded-2xl border text-left transition-all ${
                        active
                          ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 to-violet-500/5 shadow-[0_10px_40px_-15px_rgba(6,182,212,0.5)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/25"
                      }`}
                    >
                      {recomendado && (
                        <span className="absolute -top-2 -right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg">
                          Recomendado
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl grid place-items-center border shrink-0 ${
                          active ? "bg-cyan-500/25 border-cyan-400/50" : "bg-white/[0.03] border-white/10"
                        }`}>
                          <m.icon className={`w-5 h-5 ${active ? "text-cyan-200" : "text-slate-300"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-white text-sm">{m.label}</div>
                            <div className={`w-4 h-4 rounded border grid place-items-center shrink-0 ml-auto ${
                              active ? "bg-cyan-400 border-cyan-400" : "border-white/25"
                            }`}>
                              {active && <Check className="w-3 h-3 text-slate-900" />}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.desc}</p>

                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Resumo lateral */}
              <aside className="lg:sticky lg:top-6 h-fit p-5 rounded-2xl border border-violet-400/30 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 backdrop-blur-md">
                <div className="text-xs uppercase tracking-widest text-violet-300">Seu plano</div>
                <div className="mt-3 pb-3 border-b border-white/10">
                  <div className="text-sm text-slate-400">Base</div>
                  <div className="text-white font-medium mt-1">{segment.label}</div>
                </div>
                <div className="mt-3 pb-3 border-b border-white/10">
                  <div className="text-sm text-slate-400 mb-1">Módulos ({selected.size})</div>
                  {selected.size === 0
                    ? <div className="text-xs text-slate-500 italic">Nenhum módulo selecionado</div>
                    : Array.from(selected).map(id => {
                        const m = MODULOS.find(x => x.id === id)!;
                        return (
                          <div key={id} className="text-xs py-0.5 text-slate-300 truncate">
                            {m.label}
                          </div>
                        );
                      })
                  }
                </div>
                <div className="mt-4">
                  <div className="text-sm text-slate-300">Valor</div>
                  <div className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent mt-1">
                    Sob consulta
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Envie sua seleção e retornamos com uma proposta personalizada.</p>
                </div>

                <Button onClick={() => setStep(3)} className="w-full mt-5 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)]">
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </aside>
            </div>
          </motion.div>
        )}

        {/* STEP 3 — Contato / envio */}
        {step === 3 && segment && !done && (
          <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
              <div>
                <h3 className="text-2xl font-bold">Quase lá! Como podemos te chamar?</h3>
                <p className="text-slate-400 text-sm mt-1">Recebemos sua proposta e entramos em contato pelo WhatsApp.</p>
              </div>
              <button onClick={() => setStep(2)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Ajustar módulos
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-xs uppercase tracking-widest">Nome *</Label>
                  <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Seu nome" className="bg-white/[0.03] border-white/10 mt-1.5" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs uppercase tracking-widest">Empresa</Label>
                  <Input value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} placeholder="Nome do estabelecimento" className="bg-white/[0.03] border-white/10 mt-1.5" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs uppercase tracking-widest">WhatsApp *</Label>
                  <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="(73) 99999-9999" className="bg-white/[0.03] border-white/10 mt-1.5" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs uppercase tracking-widest">E-mail</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="voce@exemplo.com" className="bg-white/[0.03] border-white/10 mt-1.5" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs uppercase tracking-widest">Observações</Label>
                  <Textarea value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} placeholder="Ex.: preciso de treinamento presencial, tenho 2 lojas..." className="bg-white/[0.03] border-white/10 mt-1.5" rows={3} />
                </div>
              </div>

              <aside className="p-5 rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-cyan-500/10 to-violet-500/5 backdrop-blur-md h-fit">
                <div className="text-xs uppercase tracking-widest text-cyan-300">Resumo da proposta</div>
                <div className="mt-3 space-y-1 text-sm">
                  <div><span className="text-slate-400">Segmento:</span> <span className="text-white font-medium">{segment.label}</span></div>
                  <div className="text-slate-400 pt-2">Inclusos:</div>
                  <ul className="space-y-1 pl-1">
                    <li className="flex items-start gap-2 text-slate-200"><Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> Sistema base {segment.label}</li>
                    {Array.from(selected).map(id => {
                      const m = MODULOS.find(x => x.id === id)!;
                      return <li key={id} className="flex items-start gap-2 text-slate-200"><Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {m.label}</li>;
                    })}
                  </ul>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-300">Mensalidade</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">{BRL(totals.month)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Implantação única</span>
                    <span>{BRL(totals.setup)}</span>
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={sending || !canSubmit}
                  className="w-full mt-5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)]"
                >
                  {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                    : <><MessageCircle className="w-4 h-4 mr-2" /> Enviar proposta pelo WhatsApp</>}
                </Button>
                <p className="text-[11px] text-slate-500 mt-3 text-center">
                  Valores estimados. A proposta final pode variar conforme quantidade de terminais e customizações.
                </p>
              </aside>
            </div>
          </motion.div>
        )}

        {/* SUCESSO */}
        {done && segment && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 grid place-items-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
              <Check className="w-8 h-8 text-emerald-300" />
            </div>
            <h3 className="text-2xl font-bold mt-4">Proposta enviada com sucesso!</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">
              Recebemos sua solicitação para <b className="text-white">{segment.label}</b>. Nosso time entrará em contato pelo WhatsApp em instantes.
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
