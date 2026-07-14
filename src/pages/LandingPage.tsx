import { useState, FormEvent } from "react";

import {
  Rocket, ShieldCheck, TrendingUp, Users, Building2, Headphones,
  Landmark, ShoppingBag, Mail, MapPin, MessageCircle, Instagram,
  Linkedin, Facebook, CheckCircle2, Loader2, Sparkles, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/* =========================================================================
 * INTEGRAÇÃO COM CRM — configure aqui
 * -------------------------------------------------------------------------
 * Substitua CRM_ENDPOINT pela URL do seu endpoint de captura de leads
 * e CRM_API_KEY pelo seu Bearer Token / Chave de API.
 * Em produção, prefira usar variáveis de ambiente (import.meta.env.VITE_*)
 * ou uma Edge Function como proxy para não expor a chave no frontend.
 * ========================================================================= */
const CRM_ENDPOINT = "https://api.seucrm.com.br/v1/leads";
const CRM_API_KEY  = "COLE_SEU_BEARER_TOKEN_AQUI";

interface LeadPayload {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  origem: string;
  data: string;
}

/** Envia o lead para o CRM externo via POST. */
async function enviarLeadParaCRM(payload: LeadPayload): Promise<Response> {
  return fetch(CRM_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRM_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
}

const segmentos = [
  { icon: Building2,   title: "Contabilidade",     desc: "Escritórios contábeis e BPO financeiro." },
  { icon: ShoppingBag, title: "Varejo e Comércio", desc: "Lojas físicas, e-commerce e franquias." },
  { icon: Landmark,    title: "Serviços",          desc: "Consultorias, agências e prestadores." },
  { icon: Headphones,  title: "Suporte e TI",      desc: "Help desk, MSPs e software houses." },
  { icon: TrendingUp,  title: "Indústria",         desc: "Fábricas, distribuidoras e atacado." },
  { icon: Users,       title: "Educação",          desc: "Escolas, cursos e plataformas EAD." },
];

const stats = [
  { valor: "+12", label: "Anos de mercado" },
  { valor: "+2K", label: "Projetos entregues" },
  { valor: "98%", label: "Satisfação" },
  { valor: "4.9", label: "Nota no Google" },
];

const logos = ["Acme", "Globex", "Umbrella", "Initech", "Hooli", "Stark", "Wayne", "Vandelay"];

export default function LandingPage() {
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", mensagem: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const validar = () => {
    const e: typeof errors = {};
    if (form.nome.trim().length < 2) e.nome = "Informe seu nome completo";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "E-mail inválido";
    if (form.telefone.replace(/\D/g, "").length < 10) e.telefone = "Telefone inválido";
    if (form.mensagem.trim().length < 5) e.mensagem = "Conte um pouco sobre sua necessidade";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validar()) return;
    setStatus("sending");
    try {
      const payload: LeadPayload = {
        ...form,
        origem: "landing-page",
        data: new Date().toISOString(),
      };
      const res = await enviarLeadParaCRM(payload);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
      toast.success("Recebemos seu contato! Retornaremos em breve.");
      setForm({ nome: "", email: "", telefone: "", mensagem: "" });
    } catch (err) {
      console.error("Falha ao enviar lead:", err);
      setStatus("error");
      toast.error("Não conseguimos enviar agora. Tente novamente em instantes.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 font-sans">
      {/* Topbar simples */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0B1220]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 grid place-items-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Sua Empresa</span>
          </div>
          <a href="#contato" className="hidden sm:inline text-sm text-slate-300 hover:text-white">
            Falar com especialista →
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-teal-300 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> Soluções que geram resultado
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Transforme sua operação em <span className="bg-gradient-to-r from-teal-300 to-blue-400 bg-clip-text text-transparent">crescimento previsível</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-xl">
              Do primeiro contato ao pós-venda: automatizamos processos, integramos sistemas e entregamos gestão de verdade para o seu negócio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contato">
                <Button size="lg" className="bg-gradient-to-r from-teal-500 to-blue-600 hover:opacity-90 text-white">
                  Solicitar orçamento <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <a href="#segmentos">
                <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                  Ver segmentos
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Form Hero */}
          <motion.div
            id="contato"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl"
          >
            <h2 className="text-xl font-semibold mb-1">Fale com um especialista</h2>
            <p className="text-sm text-slate-400 mb-6">Preencha e retornamos em até 1 dia útil.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome" className="text-slate-200">Nome</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Seu nome completo"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                {errors.nome && <p className="text-xs text-red-400 mt-1">{errors.nome}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-slate-200">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="voce@empresa.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="telefone" className="text-slate-200">WhatsApp</Label>
                  <Input
                    id="telefone"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                  {errors.telefone && <p className="text-xs text-red-400 mt-1">{errors.telefone}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="mensagem" className="text-slate-200">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  rows={3}
                  value={form.mensagem}
                  onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                  placeholder="Conte brevemente o que você procura"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                {errors.mensagem && <p className="text-xs text-red-400 mt-1">{errors.mensagem}</p>}
              </div>

              <Button
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:opacity-90 text-white"
              >
                {status === "sending" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                ) : status === "success" ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Enviado!</>
                ) : (
                  <>Solicitar orçamento <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>

              {status === "success" && (
                <p className="text-sm text-teal-300 text-center">Recebemos seu contato. Em breve retornaremos.</p>
              )}
              {status === "error" && (
                <p className="text-sm text-red-400 text-center">Erro ao enviar. Tente novamente ou fale pelo WhatsApp.</p>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      {/* SEGMENTOS */}
      <section id="segmentos" className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Segmentos que atendemos</h2>
            <p className="mt-3 text-slate-400">Soluções sob medida para cada mercado.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {segmentos.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-teal-400/30 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-white/10 grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                  <s.icon className="w-5 h-5 text-teal-300" />
                </div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE + STATS */}
      <section className="py-20 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Uma parceria construída em resultados</h2>
            <p className="mt-5 text-slate-300 leading-relaxed">
              Somos uma empresa dedicada a simplificar a gestão do seu negócio. Combinamos tecnologia, processos e
              atendimento humano para entregar soluções escaláveis, com foco no que realmente importa: o crescimento
              dos nossos clientes.
            </p>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Do onboarding ao suporte contínuo, nosso time atua como extensão do seu — com metodologia, transparência
              e indicadores claros de sucesso.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-300 to-blue-400 bg-clip-text text-transparent">
                  {s.valor}
                </div>
                <div className="text-sm text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs uppercase tracking-widest text-slate-500 mb-8">
            Empresas que confiam no nosso trabalho
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 items-center">
            {logos.map((logo) => (
              <div
                key={logo}
                className="text-center text-xl font-semibold text-slate-500 grayscale hover:grayscale-0 hover:text-teal-300 transition-all cursor-default"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="border-t border-white/5 bg-[#080E1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 grid place-items-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Sua Empresa</span>
            </div>
            <p className="text-sm text-slate-400">Tecnologia e gestão para empresas que querem crescer com previsibilidade.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Contato</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-teal-400" /> Rua Exemplo, 123 — São Paulo/SP</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-teal-400" /> contato@suaempresa.com</li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-teal-400" />
                <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="hover:text-white">
                  WhatsApp: (11) 99999-9999
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Redes sociais</h4>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10"><Facebook className="w-4 h-4" /></a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white">Política de privacidade</a></li>
              <li><a href="#" className="hover:text-white">Termos de uso</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Sua Empresa. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
