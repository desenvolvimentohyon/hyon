import { useState, useEffect, useMemo } from "react";
import hyonLogo from "@/assets/hyon-logo-offwhite.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { formatCNPJ } from "@/lib/cnpjUtils";
import {
  ShieldCheck, TrendingUp, Users, Building2, Headphones,
  Mail, MapPin, MessageCircle, Instagram, Linkedin, Facebook,
  ArrowRight, ArrowUp, Check, Star, Sparkles, Zap, Cloud, Lock,
  BarChart3, Boxes, FileText, Receipt, Wallet, Store, UtensilsCrossed,
  Wrench, Package, LayoutDashboard, Factory, UserPlus, ClipboardList,
  ScrollText, CircleDollarSign, Warehouse, LineChart, Award, Rocket,
  RefreshCw, Plug, Cpu, GraduationCap, Truck, FileSignature, Menu, X,
  ChevronDown, PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ---------------- Empresa dinâmica ---------------- */
type EmpresaInfo = {
  nome: string; razao: string; cnpj: string; email: string;
  whatsapp: string; whatsappFmt: string; endereco: string;
};
const EMPRESA_FALLBACK: EmpresaInfo = {
  nome: "HYON TECNOLOGIA",
  razao: "M S DOS SANTOS PASSOAS LTDA",
  cnpj: "65.535.710/0001-61",
  email: "contato@hyon.com.br",
  whatsapp: "7331911744",
  whatsappFmt: "(73) 3191-1744",
  endereco: "Rua Manaus, 20 — Portal do Monte, Itamaraju/BA — CEP 45836-000",
};
function formatPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}
function formatCEP(v?: string | null): string {
  const d = (v ?? "").replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : (v ?? "");
}
function mapProfileToEmpresa(p: any): EmpresaInfo {
  const wa = ((p?.whatsapp ?? p?.phone ?? EMPRESA_FALLBACK.whatsapp) as string).replace(/\D/g, "");
  const parts = [
    [p?.address_street, p?.address_number].filter(Boolean).join(", "),
    p?.address_complement, p?.address_neighborhood,
    [p?.address_city, p?.address_uf].filter(Boolean).join("/"),
    p?.address_cep ? `CEP ${formatCEP(p.address_cep)}` : null,
  ].filter(Boolean) as string[];
  return {
    nome: p?.trade_name || p?.legal_name || EMPRESA_FALLBACK.nome,
    razao: p?.legal_name || EMPRESA_FALLBACK.razao,
    cnpj: p?.cnpj ? formatCNPJ(p.cnpj) : EMPRESA_FALLBACK.cnpj,
    email: p?.email || EMPRESA_FALLBACK.email,
    whatsapp: wa || EMPRESA_FALLBACK.whatsapp,
    whatsappFmt: wa ? formatPhoneBR(wa) : EMPRESA_FALLBACK.whatsappFmt,
    endereco: parts.length ? parts.join(" — ") : EMPRESA_FALLBACK.endereco,
  };
}

/* ---------------- Conteúdo editável ---------------- */
const NAV = [
  { label: "Início", href: "#inicio" },
  { label: "Soluções", href: "#solucoes" },
  { label: "Planos", href: "#planos" },
  { label: "Clientes", href: "#clientes" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

const STATS = [
  { valor: "99,9%", label: "Disponibilidade" },
  { valor: "+1000", label: "Usuários ativos" },
  { valor: "100%", label: "Suporte humanizado" },
  { valor: "24/7", label: "Tecnologia" },
];

const DIFERENCIAIS = [
  { icon: Headphones, title: "Atendimento humanizado" },
  { icon: RefreshCw,  title: "Atualizações constantes" },
  { icon: ShieldCheck,title: "Segurança de dados" },
  { icon: Zap,        title: "Alta performance" },
  { icon: Cloud,      title: "100% em nuvem" },
  { icon: Award,      title: "Suporte especializado" },
];

const SOLUCOES = [
  { icon: Store,           title: "Sistema PDV",                    desc: "Frente de caixa rápido, offline-ready e integrado ao fiscal." },
  { icon: UtensilsCrossed, title: "Restaurantes",                   desc: "Mesas, comandas, delivery e KDS em uma única plataforma." },
  { icon: Wrench,          title: "Assistência Técnica",            desc: "OS, garantias, checklist e histórico completo do equipamento." },
  { icon: Package,         title: "Controle de Estoque",            desc: "Entradas, saídas, curva ABC e alertas inteligentes." },
  { icon: Boxes,           title: "ERP",                            desc: "Gestão de ponta a ponta: financeiro, fiscal, estoque e vendas." },
  { icon: BarChart3,       title: "Comercial e CRM",                desc: "Funil de vendas, propostas e acompanhamento de clientes." },
  { icon: Receipt,         title: "Emissor Fiscal",                 desc: "NFe, NFCe, NFSe, MDFe e SAT com contingência." },
  { icon: Wallet,          title: "Controle Financeiro",            desc: "Contas a pagar, receber, DRE e fluxo de caixa." },
  { icon: LayoutDashboard, title: "Dashboard Gerencial",            desc: "Indicadores em tempo real para decisões rápidas." },
  { icon: Factory,         title: "Controle de Produção",           desc: "Ordens, insumos e etapas com rastreabilidade." },
  { icon: UserPlus,        title: "Cadastro de Clientes",           desc: "Base 360° com histórico, contatos e segmentações." },
  { icon: ClipboardList,   title: "Orçamentos",                     desc: "Modelos prontos, aprovação digital e conversão em pedido." },
  { icon: ScrollText,      title: "Ordens de Serviço",              desc: "Fluxo completo do abrir ao pós-atendimento." },
  { icon: CircleDollarSign,title: "Controle de Caixa",              desc: "Abertura, sangrias, reforços e conferência." },
  { icon: Warehouse,       title: "Gestão de Depósitos",            desc: "Múltiplos armazéns e transferências entre filiais." },
  { icon: LineChart,       title: "Relatórios Inteligentes",        desc: "Análises acionáveis, exportação em PDF e Excel." },
];

const BENEFICIOS = [
  { icon: Receipt,      title: "Emissão fiscal completa" },
  { icon: Wallet,       title: "Controle financeiro" },
  { icon: Package,      title: "Estoque inteligente" },
  { icon: Users,        title: "Multiusuário" },
  { icon: Cloud,        title: "Backup automático" },
  { icon: Lock,         title: "Segurança de dados" },
  { icon: RefreshCw,    title: "Atualizações frequentes" },
  { icon: Headphones,   title: "Atendimento especializado" },
  { icon: Plug,         title: "Integrações" },
  { icon: FileText,     title: "Relatórios detalhados" },
  { icon: BarChart3,    title: "Dashboard em tempo real" },
  { icon: ShieldCheck,  title: "Controle completo" },
];

const PLANOS = [
  {
    nome: "Starter", subtitulo: "Ideal para pequenos negócios",
    preco: "R$ 149", periodo: "/mês",
    destaque: false,
    recursos: [
      "1 usuário incluso",
      "PDV + Emissor Fiscal",
      "Controle de estoque",
      "Financeiro básico",
      "Suporte em horário comercial",
      "Backup automático diário",
    ],
  },
  {
    nome: "Professional", subtitulo: "Mais vendido",
    preco: "R$ 349", periodo: "/mês",
    destaque: true,
    recursos: [
      "5 usuários inclusos",
      "Todos os módulos Starter",
      "CRM e Orçamentos",
      "Dashboard gerencial",
      "Integrações e API",
      "Suporte prioritário",
    ],
  },
  {
    nome: "Enterprise", subtitulo: "Grandes empresas",
    preco: "Sob consulta", periodo: "",
    destaque: false,
    recursos: [
      "Usuários ilimitados",
      "Multiempresa e multifilial",
      "Produção e MRP",
      "Integrações dedicadas",
      "SLA garantido em contrato",
      "Gerente de conta exclusivo",
    ],
  },
];

const COMPARATIVO_FEATURES = [
  { label: "PDV e emissão fiscal",       s: true,  p: true,  e: true },
  { label: "Controle de estoque",        s: true,  p: true,  e: true },
  { label: "Financeiro completo",        s: false, p: true,  e: true },
  { label: "CRM e propostas",            s: false, p: true,  e: true },
  { label: "Dashboard em tempo real",    s: false, p: true,  e: true },
  { label: "Integrações via API",        s: false, p: true,  e: true },
  { label: "Multiempresa e multifilial", s: false, p: false, e: true },
  { label: "SLA em contrato",            s: false, p: false, e: true },
  { label: "Gerente de conta dedicado",  s: false, p: false, e: true },
];

const SERVICOS_ADICIONAIS = [
  { icon: FileSignature, title: "Registro de Marca" },
  { icon: ShieldCheck,   title: "Certificado Digital" },
  { icon: Headphones,    title: "Suporte Remoto" },
  { icon: GraduationCap, title: "Treinamentos" },
  { icon: Rocket,        title: "Implantação" },
  { icon: Truck,         title: "Migração de Sistema" },
  { icon: Plug,          title: "Integrações" },
  { icon: Cpu,           title: "Automação Comercial" },
  { icon: Users,         title: "Consultoria" },
];

const DEPOIMENTOS = [
  { nome: "Carlos Medeiros", empresa: "Medeiros Pizza",       texto: "A implantação foi rápida e o suporte é excepcional. Nosso caixa fecha em minutos." },
  { nome: "Ana Souza",       empresa: "LF Multimarcas",       texto: "Ganhamos controle total do estoque e das vendas. A Hyon virou parte do time." },
  { nome: "Roberto Lima",    empresa: "MB Transportes",       texto: "O financeiro ficou muito mais claro. Recomendo de olhos fechados." },
  { nome: "Fernanda Alves",  empresa: "Padaria Carioca",      texto: "Sistema estável, rápido e atendimento humano. Sensacional." },
];

const TIMELINE = [
  { n: "01", title: "Contato",           desc: "Entendemos seu negócio e objetivos." },
  { n: "02", title: "Demonstração",      desc: "Mostramos o sistema aplicado ao seu contexto." },
  { n: "03", title: "Implantação",       desc: "Migração, configuração e parametrização." },
  { n: "04", title: "Treinamento",       desc: "Capacitamos sua equipe para usar tudo." },
  { n: "05", title: "Suporte Contínuo",  desc: "Estamos com você todos os dias." },
];

const FAQ = [
  { q: "Quanto tempo leva para implantar?",        a: "Na maioria dos casos entre 3 e 10 dias úteis, dependendo do porte e da migração de dados." },
  { q: "Vocês migram meus dados do sistema atual?", a: "Sim. Nosso time faz importação de cadastros, estoque, financeiro e histórico sempre que possível." },
  { q: "O sistema funciona sem internet?",         a: "O PDV possui modo contingência. Os demais módulos operam 100% em nuvem com alta disponibilidade." },
  { q: "Como funciona o suporte?",                 a: "Atendimento humanizado por WhatsApp, telefone e chamado, com SLA definido por plano." },
  { q: "Posso trocar de plano depois?",            a: "Sim, você pode fazer upgrade a qualquer momento sem perder configurações." },
  { q: "Emitem nota fiscal em todo o Brasil?",     a: "Sim: NFe, NFCe, NFSe, MDFe e SAT, com atualização constante das regras fiscais." },
];

/* ---------------- Logos clientes ---------------- */
import moinho from "@/assets/clientes/moinho.jpg.asset.json";
import nativa from "@/assets/clientes/nativa.jpg.asset.json";
import emporio from "@/assets/clientes/emporio.jpg.asset.json";
import canaldopampo from "@/assets/clientes/canaldopampo.jpg.asset.json";
import churrascariabatata from "@/assets/clientes/churrascariabatata.jpg.asset.json";
import hiperpao from "@/assets/clientes/hiperpao.jpg.asset.json";
import bompastel from "@/assets/clientes/bompastel.jpg.asset.json";
import bistroportuga from "@/assets/clientes/bistroportuga.jpg.asset.json";
import saraiva from "@/assets/clientes/saraiva.jpg.asset.json";
import jocotoka from "@/assets/clientes/jocotoka.jpg.asset.json";
import padariacarioca from "@/assets/clientes/padariacarioca.jpg.asset.json";
import mirante from "@/assets/clientes/mirante.jpg.asset.json";
import mbtransportes from "@/assets/clientes/mbtransportes.jpg.asset.json";
import viveirosantafe from "@/assets/clientes/viveirosantafe.jpg.asset.json";
import ntfrutas from "@/assets/clientes/ntfrutas.jpg.asset.json";
import sahassados from "@/assets/clientes/sahassados.jpg.asset.json";
import corteletti from "@/assets/clientes/corteletti.jpg.asset.json";
import queijariadomonte from "@/assets/clientes/queijariadomonte.jpg.asset.json";
import essenza from "@/assets/clientes/essenza.jpg.asset.json";
import bistrodolago from "@/assets/clientes/bistrodolago.jpg.asset.json";
import pizzariaatlantica from "@/assets/clientes/pizzariaatlantica.jpg.asset.json";
import avaranda from "@/assets/clientes/avaranda.jpg.asset.json";
import escritorio from "@/assets/clientes/escritorio.jpg.asset.json";
import pousadacasa from "@/assets/clientes/pousadacasa.jpg.asset.json";
import cardoso from "@/assets/clientes/cardoso.jpg.asset.json";
import lfmultimarcas from "@/assets/clientes/lfmultimarcas.jpg.asset.json";
import medeirospizza from "@/assets/clientes/medeirospizza.jpg.asset.json";
import galegolanches from "@/assets/clientes/galegolanches.jpg.asset.json";
import cabanadocal from "@/assets/clientes/cabanadocal.png.asset.json";
import acouguedoclaudio from "@/assets/clientes/acouguedoclaudio.png.asset.json";

const LOGOS = [
  { nome: "Moinho das Artes", src: moinho.url }, { nome: "Barraca Nativa", src: nativa.url },
  { nome: "Empório Oliva", src: emporio.url }, { nome: "Canal do Pampo", src: canaldopampo.url },
  { nome: "Churrascaria do Batata", src: churrascariabatata.url }, { nome: "Hiper Pão", src: hiperpao.url },
  { nome: "Bom Pastel", src: bompastel.url }, { nome: "Bistrô do Portuga", src: bistroportuga.url },
  { nome: "Floricultura Saraiva", src: saraiva.url }, { nome: "Jocotoka Village", src: jocotoka.url },
  { nome: "Padaria Carioca", src: padariacarioca.url }, { nome: "Mirante do Corumbau", src: mirante.url },
  { nome: "MB Transportes", src: mbtransportes.url }, { nome: "Viveiro Santa Fé", src: viveirosantafe.url },
  { nome: "NT Frutas", src: ntfrutas.url }, { nome: "Sah Assados", src: sahassados.url },
  { nome: "Corteletti", src: corteletti.url }, { nome: "Queijaria do Monte", src: queijariadomonte.url },
  { nome: "Essenza Corumbau", src: essenza.url }, { nome: "Bistrô do Lago", src: bistrodolago.url },
  { nome: "Pizzaria Atlântica", src: pizzariaatlantica.url }, { nome: "A Varanda", src: avaranda.url },
  { nome: "Escritório Petiscaria", src: escritorio.url }, { nome: "Pousada Casa", src: pousadacasa.url },
  { nome: "Construtora Cardoso", src: cardoso.url }, { nome: "LF Multimarcas", src: lfmultimarcas.url },
  { nome: "Medeiros Pizza", src: medeirospizza.url }, { nome: "Galego Lanche's", src: galegolanches.url },
  { nome: "Cabana do Cal", src: cabanadocal.url }, { nome: "Açougue do Cláudio", src: acouguedoclaudio.url },
];

/* ---------------- Contador animado ---------------- */
function useCountUp(target: string, run: boolean, duration = 1400) {
  const numMatch = target.match(/[\d,.]+/);
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    if (!run || !numMatch) { setDisplay(target); return; }
    const raw = numMatch[0].replace(",", ".");
    const end = parseFloat(raw);
    if (Number.isNaN(end)) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = end * eased;
      const isDec = raw.includes(".");
      const shown = isDec ? v.toFixed(1).replace(".", ",") : Math.round(v).toString();
      setDisplay(target.replace(numMatch[0], shown));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, duration]);
  return display;
}

/* ---------------- Página ---------------- */
export default function LandingPage() {
  const [EMPRESA, setEmpresa] = useState<EmpresaInfo>(EMPRESA_FALLBACK);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [statsInView, setStatsInView] = useState(false);
  const [testIdx, setTestIdx] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setShowTop(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("public-company-profile");
        if (cancelled || error) return;
        const p = (data as any)?.profile;
        if (p) setEmpresa(mapProfileToEmpresa(p));
      } catch { /* fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const el = document.getElementById("stats");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setStatsInView(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTestIdx((i) => (i + 1) % DEPOIMENTOS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const WA_FALLBACK = "7331911744";
  const waDigits = (EMPRESA.whatsapp || "").replace(/\D/g, "");
  const waNumber = waDigits.length >= 10 ? waDigits : WA_FALLBACK;
  const waFmt = waDigits.length >= 10 ? (EMPRESA.whatsappFmt || formatPhoneBR(waNumber)) : formatPhoneBR(WA_FALLBACK);
  const waLink = useMemo(
    () => (msg = "Olá! Gostaria de falar com um especialista da Hyon Tecnologia.") =>
      `https://wa.me/55${waNumber}?text=${encodeURIComponent(msg)}`,
    [waNumber]
  );

  const copyWhatsapp = async () => {
    try { await navigator.clipboard.writeText(waFmt); toast.success("WhatsApp copiado!", { description: waFmt }); }
    catch { toast.error("Não foi possível copiar"); }
  };

  const s0 = useCountUp(STATS[0].valor, statsInView);
  const s1 = useCountUp(STATS[1].valor, statsInView);
  const s2 = useCountUp(STATS[2].valor, statsInView);
  const s3 = useCountUp(STATS[3].valor, statsInView);
  const statsAnim = [s0, s1, s2, s3];

  const CTAWhats = ({ children = "Falar com um especialista", msg }: { children?: React.ReactNode; msg?: string }) => (
    <a href={waLink(msg)} target="_blank" rel="noreferrer">
      <Button
        size="lg"
        className="bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-95 text-white shadow-[0_10px_40px_-10px_rgba(37,211,102,0.6)] hover:shadow-[0_14px_50px_-8px_rgba(37,211,102,0.75)] transition-all"
      >
        <MessageCircle className="w-4 h-4 mr-2" /> {children}
      </Button>
    </a>
  );

  return (
    <div className="dark min-h-screen bg-[#09090B] text-slate-100 font-sans antialiased [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white">
      {/* Fundo global com gradientes/partículas */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#2563EB]/25 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-[#7C3AED]/25 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-[#06B6D4]/20 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      {/* Faixa de campanha */}
      <div className="relative z-40 text-center text-xs sm:text-sm py-2 px-4 bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4] text-white">
        <Sparkles className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
        Implantação com desconto por tempo limitado —
        <a href={waLink("Quero aproveitar o desconto na implantação!")} className="underline underline-offset-2 font-semibold ml-1">
          fale com um especialista
        </a>
      </div>

      {/* Navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "backdrop-blur-xl bg-[#09090B]/70 border-b border-white/10" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <a href="#inicio" className="flex items-center gap-3 shrink-0">
            <img src={hyonLogo.url} alt="Hyon Tecnologia" className="h-10 sm:h-12 w-auto object-contain" />
          </a>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}
                 className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="hidden sm:block">
            <a href={waLink("Quero solicitar uma demonstração da Hyon.")} target="_blank" rel="noreferrer">
              <Button className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 text-white shadow-[0_8px_30px_-8px_rgba(124,58,237,0.6)]">
                Solicitar Demonstração
              </Button>
            </a>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5"
            onClick={() => setMenuOpen((v) => !v)} aria-label="Abrir menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#09090B]/95 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
                   className="px-3 py-2.5 rounded-lg text-slate-200 hover:bg-white/5">
                  {n.label}
                </a>
              ))}
              <a href={waLink()} target="_blank" rel="noreferrer" className="mt-2">
                <Button className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white">
                  <MessageCircle className="w-4 h-4 mr-2" /> Falar no WhatsApp
                </Button>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="inicio" className="relative min-h-[92vh] flex items-center py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 animate-fade-in">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-cyan-300 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> Tecnologia que gera resultado
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Transformamos a gestão da sua empresa com{" "}
              <span className="bg-gradient-to-r from-[#60A5FA] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent">
                tecnologia inteligente
              </span>
              .
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl">
              Sistemas completos para lojas, restaurantes, assistência técnica, controle de estoque,
              emissão fiscal e muito mais.
            </p>
            <p className="mt-3 text-slate-400">
              Mais produtividade. Mais controle. Mais lucro.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CTAWhats>Falar pelo WhatsApp</CTAWhats>
              <a href="#solucoes">
                <Button size="lg" variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-md">
                  Solicitar Demonstração <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Dados criptografados</span>
              <span className="inline-flex items-center gap-1.5"><Cloud className="w-4 h-4 text-cyan-400" /> 100% em nuvem</span>
              <span className="inline-flex items-center gap-1.5"><Headphones className="w-4 h-4 text-violet-400" /> Suporte humano</span>
            </div>
          </div>

          {/* Mockup */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-lg">
              <div className="absolute -inset-6 bg-gradient-to-br from-[#2563EB]/40 via-[#7C3AED]/40 to-[#06B6D4]/40 blur-3xl rounded-[32px]" />
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-3 shadow-2xl">
                {/* barra de janela */}
                <div className="flex items-center gap-1.5 px-2 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                {/* "dashboard" */}
                <div className="rounded-xl bg-[#0B1220] border border-white/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">Dashboard Hyon</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> online
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "MRR", v: "R$ 128k" },
                      { l: "Vendas", v: "1.284" },
                      { l: "Ticket", v: "R$ 96" },
                    ].map((k) => (
                      <div key={k.l} className="rounded-lg bg-white/[0.03] border border-white/10 p-3">
                        <div className="text-[10px] text-slate-400">{k.l}</div>
                        <div className="text-sm font-semibold bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">{k.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-24 rounded-lg bg-gradient-to-tr from-[#2563EB]/20 via-[#7C3AED]/20 to-[#06B6D4]/20 border border-white/10 relative overflow-hidden">
                    <svg viewBox="0 0 200 80" className="absolute inset-0 w-full h-full">
                      <polyline fill="none" stroke="url(#g)" strokeWidth="2"
                        points="0,60 20,52 40,55 60,40 80,45 100,30 120,35 140,20 160,28 180,15 200,22" />
                      <defs>
                        <linearGradient id="g" x1="0" x2="1">
                          <stop offset="0%" stopColor="#60A5FA" />
                          <stop offset="50%" stopColor="#A78BFA" />
                          <stop offset="100%" stopColor="#22D3EE" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/[0.03] border border-white/10 p-2 text-[10px] text-slate-300 flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-cyan-300" /> NFe emitida #4218
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/10 p-2 text-[10px] text-slate-300 flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-violet-300" /> Estoque atualizado
                    </div>
                  </div>
                </div>
              </div>
              {/* elementos flutuantes */}
              <div className="hidden md:flex absolute -left-8 top-10 items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-xs text-slate-200 shadow-xl animate-fade-in">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Backup em nuvem
              </div>
              <div className="hidden md:flex absolute -right-6 bottom-8 items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-xs text-slate-200 shadow-xl animate-fade-in">
                <Zap className="w-4 h-4 text-yellow-300" /> Sincronização em tempo real
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-14 border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={s.label} className="text-center p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#60A5FA] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent tabular-nums">
                {statsAnim[i]}
              </div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Tecnologia que impulsiona negócios.</h2>
            <p className="mt-5 text-slate-300 leading-relaxed">
              A <strong>Hyon Tecnologia</strong> desenvolve soluções completas para gestão empresarial,
              unindo software robusto, atendimento humano e processos claros. Somos parceiros dos nossos
              clientes do primeiro contato ao pós-venda.
            </p>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Do ponto de venda ao ERP, cuidamos de cada detalhe para que a tecnologia trabalhe por você —
              com previsibilidade, segurança e escala.
            </p>
            <div className="mt-6"><CTAWhats msg="Quero conhecer melhor a Hyon Tecnologia.">Conversar com um consultor</CTAWhats></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {DIFERENCIAIS.map((d) => (
              <div key={d.title}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.06] transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB]/25 to-[#7C3AED]/25 border border-white/10 grid place-items-center mb-3">
                  <d.icon className="w-5 h-5 text-cyan-300" />
                </div>
                <div className="font-medium">{d.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÕES */}
      <section id="solucoes" className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-cyan-300">Nossas soluções</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Sistemas sob medida para o seu negócio</h2>
            <p className="mt-3 text-slate-400">Modulares, escaláveis e prontos para crescer com você.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SOLUCOES.map((s) => (
              <div key={s.title}
                className="group p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.06] transition-all">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2563EB]/25 to-[#7C3AED]/25 border border-white/10 grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                  <s.icon className="w-5 h-5 text-cyan-300" />
                </div>
                <h3 className="font-semibold text-base">{s.title}</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                <a href={waLink(`Quero saber mais sobre: ${s.title}.`)} target="_blank" rel="noreferrer"
                   className="mt-4 inline-flex items-center text-sm text-cyan-300 hover:text-white gap-1 group/link">
                  Saiba mais <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                </a>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center"><CTAWhats msg="Quero uma demonstração dos sistemas Hyon.">Solicitar demonstração</CTAWhats></div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="py-20 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Benefícios que fazem diferença</h2>
            <p className="mt-3 text-slate-400">Tudo que sua operação precisa em uma única plataforma.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BENEFICIOS.map((b) => (
              <div key={b.title} className="p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center gap-3 hover:border-cyan-400/30 transition-all">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563EB]/25 to-[#06B6D4]/25 border border-white/10 grid place-items-center">
                  <b.icon className="w-4.5 h-4.5 text-cyan-300" />
                </div>
                <span className="text-sm text-slate-200">{b.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-violet-300">Planos</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Escolha o plano ideal para o seu momento</h2>
            <p className="mt-3 text-slate-400">Comece pequeno, cresça sem limites.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PLANOS.map((p) => (
              <div key={p.nome}
                className={`relative p-7 rounded-3xl border backdrop-blur-md transition-all hover:-translate-y-1 ${
                  p.destaque
                    ? "border-violet-400/40 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 shadow-[0_20px_60px_-20px_rgba(124,58,237,0.5)]"
                    : "border-white/10 bg-white/[0.03] hover:border-cyan-400/30"
                }`}
              >
                {p.destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg">
                    Mais vendido
                  </span>
                )}
                <div className="text-lg font-semibold">{p.nome}</div>
                <div className="text-sm text-slate-400 mt-0.5">{p.subtitulo}</div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold bg-gradient-to-r from-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent">{p.preco}</span>
                  {p.periodo && <span className="text-slate-400 text-sm">{p.periodo}</span>}
                </div>
                <ul className="mt-6 space-y-2.5">
                  {p.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
                <a href={waLink(`Tenho interesse no plano ${p.nome} da Hyon.`)} target="_blank" rel="noreferrer" className="block mt-7">
                  <Button className={`w-full ${
                    p.destaque
                      ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-[0_10px_40px_-10px_rgba(37,211,102,0.6)]"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                  }`}>
                    <MessageCircle className="w-4 h-4 mr-2" /> Contratar pelo WhatsApp
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="py-20 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Compare os planos</h2>
            <p className="mt-3 text-slate-400">Recursos disponíveis em cada plano.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04]">
                <tr className="text-left">
                  <th className="px-5 py-4 font-medium text-slate-300">Recursos</th>
                  <th className="px-5 py-4 font-medium text-slate-300 text-center">Starter</th>
                  <th className="px-5 py-4 font-medium text-white text-center">Professional</th>
                  <th className="px-5 py-4 font-medium text-slate-300 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIVO_FEATURES.map((f, i) => (
                  <tr key={f.label} className={i % 2 ? "bg-white/[0.015]" : ""}>
                    <td className="px-5 py-3 text-slate-200">{f.label}</td>
                    {[f.s, f.p, f.e].map((v, k) => (
                      <td key={k} className="px-5 py-3 text-center">
                        {v ? <Check className="inline w-4 h-4 text-emerald-400" /> : <span className="text-slate-600">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SERVIÇOS ADICIONAIS */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Serviços adicionais</h2>
            <p className="mt-3 text-slate-400">Vá além do software com serviços especializados.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICOS_ADICIONAIS.map((s) => (
              <div key={s.title} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:-translate-y-1 hover:border-violet-400/30 transition-all">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C3AED]/25 to-[#06B6D4]/25 border border-white/10 grid place-items-center mb-4">
                  <s.icon className="w-5 h-5 text-cyan-300" />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <a href={waLink(`Quero um orçamento para: ${s.title}.`)} target="_blank" rel="noreferrer"
                   className="mt-3 inline-flex items-center text-sm text-cyan-300 hover:text-white gap-1">
                  Solicitar orçamento <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-20 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Quem usa, recomenda</h2>
          <p className="mt-3 text-slate-400">Clientes reais compartilhando resultados reais.</p>
          <div className="mt-10 p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md min-h-[220px] relative">
            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg text-slate-200 italic leading-relaxed">"{DEPOIMENTOS[testIdx].texto}"</p>
            <div className="mt-6">
              <div className="font-semibold">{DEPOIMENTOS[testIdx].nome}</div>
              <div className="text-sm text-slate-400">{DEPOIMENTOS[testIdx].empresa}</div>
            </div>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            {DEPOIMENTOS.map((_, i) => (
              <button key={i} onClick={() => setTestIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === testIdx ? "w-8 bg-cyan-300" : "w-2 bg-white/20"}`}
                aria-label={`Depoimento ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* LOGOS carrossel */}
      <section id="clientes" className="py-16 border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs uppercase tracking-widest text-slate-500 mb-8">
            Empresas que confiam no nosso trabalho
          </p>
        </div>
        <div className="relative group [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex gap-6 w-max animate-[marquee_60s_linear_infinite] group-hover:[animation-play-state:paused]">
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              <div key={`${logo.nome}-${i}`} title={logo.nome}
                className="shrink-0 w-32 h-32 sm:w-36 sm:h-36 rounded-xl bg-white/[0.03] border border-white/10 p-3 grid place-items-center hover:bg-white/[0.06] hover:border-cyan-400/30 transition-all">
                <img src={logo.src} alt={logo.nome} loading="lazy"
                  className="max-h-full max-w-full object-contain rounded-lg opacity-90 hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Como acontece a implantação</h2>
            <p className="mt-3 text-slate-400">Um processo simples, transparente e sem sustos.</p>
          </div>
          <div className="relative grid md:grid-cols-5 gap-6">
            {TIMELINE.map((t) => (
              <div key={t.n} className="relative p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md text-center hover:-translate-y-1 hover:border-cyan-400/30 transition-all">
                <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] grid place-items-center text-white font-bold shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)]">
                  {t.n}
                </div>
                <div className="mt-4 font-semibold">{t.title}</div>
                <p className="mt-1 text-sm text-slate-400">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Perguntas frequentes</h2>
            <p className="mt-3 text-slate-400">Se ainda ficar alguma dúvida, chame no WhatsApp.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map((f, i) => {
              const open = faqOpen === i;
              return (
                <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden">
                  <button onClick={() => setFaqOpen(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03]">
                    <span className="font-medium">{f.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 -mt-1 text-sm text-slate-300 leading-relaxed animate-fade-in">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center"><CTAWhats msg="Tenho uma dúvida sobre a Hyon.">Conversar com um consultor</CTAWhats></div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="contato" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#06B6D4] opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Pronto para transformar sua empresa?</h2>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Fale agora com um especialista e descubra como a Hyon pode automatizar sua gestão.
          </p>
          <div className="mt-8 flex justify-center">
            <a href={waLink("Quero transformar minha empresa com a Hyon!")} target="_blank" rel="noreferrer">
              <Button size="lg" className="text-base px-8 py-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-95 text-white shadow-[0_20px_60px_-15px_rgba(37,211,102,0.7)] animate-pulse">
                <MessageCircle className="w-5 h-5 mr-2" /> Quero falar no WhatsApp
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-400">Atendimento humano, resposta rápida.</p>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="border-t border-white/5 bg-[#050609]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <img src={hyonLogo.url} alt="Hyon Tecnologia" className="h-20 sm:h-24 w-auto object-contain mb-4" />
            <p className="text-sm text-slate-400">Tecnologia e gestão para empresas que querem crescer com previsibilidade.</p>
            <p className="text-xs text-slate-500 mt-4">{EMPRESA.razao}</p>
            <p className="text-xs text-slate-500">CNPJ: {EMPRESA.cnpj}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Contato</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EMPRESA.endereco)}`}
                   target="_blank" rel="noreferrer"
                   className="flex items-start gap-2 hover:text-white transition-colors">
                  <MapPin className="w-4 h-4 mt-0.5 text-cyan-400 shrink-0" />
                  <span className="underline-offset-2 hover:underline">{EMPRESA.endereco}</span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <a href={`mailto:${EMPRESA.email}`} className="hover:text-white">{EMPRESA.email}</a>
              </li>
              <li className="flex items-center gap-2 flex-wrap">
                <MessageCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <a href={waLink()} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp: {waFmt}</a>
                <button type="button" onClick={copyWhatsapp}
                  className="text-xs px-2 py-0.5 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors">
                  Copiar
                </button>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-cyan-400" />
                <a href={`tel:+55${waNumber}`} className="hover:text-white">Ligar agora</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Links rápidos</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {NAV.map((n) => (
                <li key={n.href}><a href={n.href} className="hover:text-white">{n.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Redes sociais</h4>
            <div className="flex gap-3">
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10 hover:border-cyan-400/30 transition-all"><Instagram className="w-4 h-4" /></a>
              <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10 hover:border-cyan-400/30 transition-all"><Linkedin className="w-4 h-4" /></a>
              <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10 hover:border-cyan-400/30 transition-all"><Facebook className="w-4 h-4" /></a>
              <a href={waLink()} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/30 grid place-items-center hover:bg-emerald-500/25 transition-all">
                <MessageCircle className="w-4 h-4 text-emerald-300" />
              </a>
            </div>
            <div className="mt-6 text-xs text-slate-500 space-y-1">
              <a href="#" className="block hover:text-white">Política de privacidade</a>
              <a href="#" className="block hover:text-white">Termos de uso</a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Hyon Tecnologia. Todos os direitos reservados.
        </div>
      </footer>

      {/* Botão flutuante WhatsApp */}
      <a
        href={waLink()} target="_blank" rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 group"
        aria-label="Falar no WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
        <span className="relative flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-[0_15px_50px_-10px_rgba(37,211,102,0.7)] hover:scale-105 transition-transform">
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">Podemos ajudar?</span>
        </span>
      </a>

      {/* Botão voltar ao topo */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 left-5 z-50 w-11 h-11 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white grid place-items-center hover:bg-white/20 transition-all animate-fade-in"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
