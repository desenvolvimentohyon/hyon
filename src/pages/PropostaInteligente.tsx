import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePropostas } from "@/contexts/PropostasContext";
import { useApp } from "@/contexts/AppContext";
import { useParametros } from "@/contexts/ParametrosContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PropostaResumoLateral } from "@/components/propostas/PropostaResumoLateral";
import { PropostaComparador } from "@/components/propostas/PropostaComparador";
import { PropostaSugestoes } from "@/components/propostas/PropostaSugestoes";
import { ConsultoraComercialIA } from "@/components/propostas/ConsultoraComercialIA";

import { ArrowLeft, User, Monitor, Puzzle, Tag, MapPin, Users, CreditCard, FileText, Plus } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  commission_implant_percent: number | null;
  commission_recur_percent: number | null;
  commission_recur_months: number | null;
  commission_recur_apply_on: string | null;
}

interface Region {
  id: string;
  name: string;
  base_value: number;
  additional_fee: number;
  active: boolean;
}

interface CompanyImpl {
  impl_cost_per_km: number;
  impl_daily_rate: number;
  impl_default_days: number;
}

export default function PropostaInteligente() {
  const navigate = useNavigate();
  const { addProposta, crmConfig } = usePropostas();
  const { clientes, addCliente } = useApp();
  const { sistemas, modulos, planos, formasPagamento } = useParametros();

  // External data
  const [partners, setPartners] = useState<Partner[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [companyImpl, setCompanyImpl] = useState<CompanyImpl>({ impl_cost_per_km: 0, impl_daily_rate: 0, impl_default_days: 1 });
  const [gerando, setGerando] = useState(false);

  // Form state
  const [clienteId, setClienteId] = useState("");
  const [sistemaId, setSistemaId] = useState("");
  const [moduloIds, setModuloIds] = useState<string[]>([]);
  const [planoId, setPlanoId] = useState("");
  const [regiaoId, setRegiaoId] = useState("");
  const [distanciaKm, setDistanciaKm] = useState(0);
  const [dias, setDias] = useState(1);
  const [parceiroId, setParceiroId] = useState("");
  const [formaPagamentoId, setFormaPagamentoId] = useState("");
  const [fluxoImplantacao, setFluxoImplantacao] = useState<"a_vista" | "parcelado">("a_vista");
  const [parcelasImplantacao, setParcelasImplantacao] = useState(2);
  const [descontoManualPercent, setDescontoManualPercent] = useState(0);
  const [observacoes, setObservacoes] = useState(crmConfig.informacoesAdicionaisPadrao || "");

  // Novo cliente inline
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteTelefone, setNovoClienteTelefone] = useState("");
  const [novoClienteEmail, setNovoClienteEmail] = useState("");
  const [novoClienteCidade, setNovoClienteCidade] = useState("");

  // Fetch external data on mount
  useEffect(() => {
    Promise.all([
      supabase.from("partners").select("id, name, commission_implant_percent, commission_recur_percent, commission_recur_months, commission_recur_apply_on").eq("active", true).order("name"),
      supabase.from("deployment_regions").select("*").eq("active", true).order("name"),
      supabase.from("company_profile").select("impl_cost_per_km, impl_daily_rate, impl_default_days").maybeSingle(),
    ]).then(([pRes, rRes, cRes]) => {
      if (pRes.data) setPartners(pRes.data as any);
      if (rRes.data) setRegions(rRes.data as any);
      if (cRes.data) {
        setCompanyImpl(cRes.data as any);
        setDias(cRes.data.impl_default_days || 1);
      }
    });
  }, []);

  // Auto-select all active modules for selected system
  useEffect(() => {
    if (sistemaId) {
      const systemModules = modulos.filter(m => m.ativo && m.sistemaId === sistemaId);
      setModuloIds(systemModules.map(m => m.id));
    } else {
      setModuloIds([]);
    }
  }, [sistemaId, modulos]);

  // Derived calculations
  const sistema = useMemo(() => sistemas.find(s => s.id === sistemaId), [sistemas, sistemaId]);
  const plano = useMemo(() => planos.find(p => p.id === planoId), [planos, planoId]);
  const regiao = useMemo(() => regions.find(r => r.id === regiaoId), [regions, regiaoId]);
  const parceiro = useMemo(() => partners.find(p => p.id === parceiroId), [partners, parceiroId]);
  const formaPag = useMemo(() => formasPagamento.find(f => f.id === formaPagamentoId), [formasPagamento, formaPagamentoId]);
  const cliente = useMemo(() => clientes.find(c => c.id === clienteId), [clientes, clienteId]);

  const modulosSelecionados = useMemo(() =>
    modulos.filter(m => moduloIds.includes(m.id)),
    [modulos, moduloIds]
  );

  const calc = useMemo(() => {
    const sistemaValor = sistema?.valorVenda || 0;
    const modulosValor = modulosSelecionados.reduce((sum, m) => sum + m.valorVenda, 0);
    const mensalidadeBase = sistemaValor + modulosValor;
    const descontoPercent = plano?.descontoPercentual || 0;
    const descontoValor = mensalidadeBase * (descontoPercent / 100);
    const valorAposPlano = mensalidadeBase - descontoValor;
    const descontoManualValor = valorAposPlano * (descontoManualPercent / 100);
    const mensalidadeFinal = valorAposPlano - descontoManualValor;

    const implKm = distanciaKm * companyImpl.impl_cost_per_km;
    const implRegiao = regiao ? regiao.base_value + regiao.additional_fee : 0;
    const implDiarias = dias * companyImpl.impl_daily_rate;
    const implantacaoTotal = implKm + implRegiao + implDiarias;

    const comissaoImpl = parceiro && parceiro.commission_implant_percent
      ? implantacaoTotal * (parceiro.commission_implant_percent / 100)
      : 0;
    const comissaoRecur = parceiro && parceiro.commission_recur_percent
      ? mensalidadeFinal * (parceiro.commission_recur_percent / 100)
      : 0;

    return {
      sistemaValor, modulosValor, mensalidadeBase,
      descontoPercent, descontoValor, mensalidadeFinal,
      implKm, implRegiao, implDiarias, implantacaoTotal,
      comissaoImpl, comissaoRecur,
    };
  }, [sistema, modulosSelecionados, plano, distanciaKm, companyImpl, regiao, dias, parceiro]);

  const resumoData = useMemo(() => ({
    sistemaNome: sistema?.nome || "",
    sistemaValor: calc.sistemaValor,
    modulosSelecionados: modulosSelecionados.map(m => ({ nome: m.nome, valor: m.valorVenda })),
    planoNome: plano?.nomePlano || "",
    descontoPercent: calc.descontoPercent,
    descontoValor: calc.descontoValor,
    mensalidadeBase: calc.mensalidadeBase,
    mensalidadeFinal: calc.mensalidadeFinal,
    implantacaoKm: distanciaKm,
    implantacaoKmValor: calc.implKm,
    implantacaoRegiaoNome: regiao?.name || "",
    implantacaoRegiaoValor: calc.implRegiao,
    implantacaoDiarias: dias,
    implantacaoDiariasValor: calc.implDiarias,
    implantacaoTotal: calc.implantacaoTotal,
    parceiroNome: parceiro?.name || "",
    comissaoImplantacao: calc.comissaoImpl,
    comissaoRecorrente: calc.comissaoRecur,
    formaPagamento: formaPag?.nome || "",
    fluxoImplantacao,
    parcelasImplantacao,
  }), [sistema, modulosSelecionados, plano, calc, distanciaKm, regiao, dias, parceiro, formaPag, fluxoImplantacao, parcelasImplantacao]);

  const handleToggleModulo = useCallback((id: string) => {
    setModuloIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleGerarProposta = useCallback(async () => {
    if (!sistemaId) {
      toast.error("Selecione um sistema para gerar a proposta.");
      return;
    }
    if (clienteId === "novo" && !novoClienteNome.trim()) {
      toast.error("Informe o nome do novo cliente.");
      return;
    }
    setGerando(true);
    try {
      let finalClienteId = clienteId;
      let finalClienteNome = cliente?.nome || "";

      // Criar novo cliente se necessário
      if (clienteId === "novo") {
        addCliente({
          nome: novoClienteNome.trim(),
          telefone: novoClienteTelefone.trim() || undefined,
          email: novoClienteEmail.trim() || undefined,
        });
        finalClienteId = "";
        finalClienteNome = novoClienteNome.trim();
      }

      const itens = [
        { id: crypto.randomUUID(), descricao: `Sistema: ${sistema?.nome}`, quantidade: 1, valor: calc.sistemaValor },
        ...modulosSelecionados.map(m => ({
          id: crypto.randomUUID(), descricao: `Módulo: ${m.nome}`, quantidade: 1, valor: m.valorVenda,
        })),
      ];

      addProposta({
        clienteId: finalClienteId || null,
        clienteNomeSnapshot: finalClienteNome,
        sistema: (sistema?.nome || "OUTRO") as any,
        planoNome: plano?.nomePlano || "",
        valorMensalidade: calc.mensalidadeFinal,
        valorImplantacao: calc.implantacaoTotal,
        fluxoPagamentoImplantacao: fluxoImplantacao,
        parcelasImplantacao: fluxoImplantacao === "parcelado" ? parcelasImplantacao : null,
        dataEnvio: null,
        validadeDias: crmConfig.validadePadraoDias,
        dataValidade: null,
        statusCRM: crmConfig.statusKanban[0] || "Rascunho",
        statusVisualizacao: "nao_enviado",
        statusAceite: "pendente",
        pdfGeradoEm: null,
        observacoesInternas: observacoes,
        informacoesAdicionais: crmConfig.informacoesAdicionaisPadrao,
        itens,
        partnerId: parceiroId || null,
        partnerCommissionPercent: parceiro?.commission_implant_percent || null,
        partnerCommissionValue: calc.comissaoImpl > 0 ? calc.comissaoImpl : null,
        commissionGenerated: false,
        partnerCommissionImplantPercent: parceiro?.commission_implant_percent || null,
        partnerCommissionImplantValue: calc.comissaoImpl > 0 ? calc.comissaoImpl : null,
        partnerCommissionRecurPercent: parceiro?.commission_recur_percent || null,
        partnerCommissionRecurMonths: parceiro?.commission_recur_months || null,
        partnerCommissionRecurApplyOn: parceiro?.commission_recur_apply_on || null,
        commissionImplantGenerated: false,
        whatsappSentAt: null,
        whatsappSendCount: 0,
      });

      toast.success("Proposta gerada com sucesso!");
      // Small delay for the proposal to be created then navigate
      setTimeout(() => navigate("/propostas"), 500);
    } catch {
      toast.error("Erro ao gerar proposta.");
    } finally {
      setGerando(false);
    }
  }, [sistemaId, sistema, clienteId, cliente, plano, calc, modulosSelecionados, fluxoImplantacao, parcelasImplantacao, observacoes, parceiroId, parceiro, crmConfig, addProposta, addCliente, navigate, novoClienteNome, novoClienteTelefone, novoClienteEmail]);

  const sistemasAtivos = useMemo(() => sistemas.filter(s => s.ativo), [sistemas]);
  const modulosDoSistema = useMemo(() => modulos.filter(m => m.ativo && m.sistemaId === sistemaId), [modulos, sistemaId]);
  const planosAtivos = useMemo(() => planos.filter(p => p.ativo), [planos]);
  const formasAtivas = useMemo(() => formasPagamento.filter(f => f.ativo), [formasPagamento]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nova Proposta Inteligente"
        subtitle="Monte sua proposta com cálculos automáticos e sugestões inteligentes"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/propostas")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">
          {/* 1. Cliente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-blue-500" /> Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent className="max-h-[140px]">
                  <SelectItem value="novo">
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Plus className="h-3.5 w-3.5" /> Cadastrar novo cliente
                    </span>
                  </SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {clienteId === "novo" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome *</Label>
                    <Input placeholder="Nome do cliente" value={novoClienteNome} onChange={e => setNovoClienteNome(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Telefone</Label>
                    <Input placeholder="(00) 00000-0000" value={novoClienteTelefone} onChange={e => setNovoClienteTelefone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input placeholder="email@exemplo.com" value={novoClienteEmail} onChange={e => setNovoClienteEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cidade</Label>
                    <Input placeholder="Cidade" value={novoClienteCidade} onChange={e => setNovoClienteCidade(e.target.value)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Sistema */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /> Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={sistemaId} onValueChange={setSistemaId}>
                <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
                <SelectContent>
                  {sistemasAtivos.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome} — R$ {s.valorVenda.toFixed(2)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 3. Módulos */}
          {modulosDoSistema.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Puzzle className="h-4 w-4 text-violet-500" /> Módulos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modulosDoSistema.map(m => (
                    <label key={m.id} className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 cursor-pointer hover:bg-accent/40 transition-colors">
                      <Checkbox
                        checked={moduloIds.includes(m.id)}
                        onCheckedChange={() => handleToggleModulo(m.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.nome}</p>
                        <p className="text-xs text-muted-foreground">R$ {m.valorVenda.toFixed(2)}/mês</p>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Plano + Comparador */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-amber-500" /> Plano e Desconto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={planoId} onValueChange={setPlanoId}>
                <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                <SelectContent>
                  {planosAtivos.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nomePlano} — {p.descontoPercentual}% desc. ({p.validadeMeses} {p.validadeMeses === 1 ? "mês" : "meses"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {calc.descontoPercent > 0 && calc.mensalidadeBase > 0 && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor original</span><span className="line-through">R$ {calc.mensalidadeBase.toFixed(2)}</span></div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Desconto ({calc.descontoPercent}%)</span><span>-R$ {calc.descontoValor.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-semibold"><span>Valor final</span><span className="text-primary">R$ {calc.mensalidadeFinal.toFixed(2)}</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparador */}
          <PropostaComparador
            planos={planosAtivos}
            mensalidadeBase={calc.mensalidadeBase}
            implantacaoTotal={calc.implantacaoTotal}
            planoSelecionadoId={planoId}
            onSelectPlano={setPlanoId}
          />

          {/* 5. Implantação */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-500" /> Implantação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Região</Label>
                  <Select value={regiaoId} onValueChange={setRegiaoId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name} (R$ {r.base_value.toFixed(2)})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Distância (km)</Label>
                  <Input type="number" min={0} value={distanciaKm} onChange={e => setDistanciaKm(Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Dias</Label>
                  <Input type="number" min={1} value={dias} onChange={e => setDias(Number(e.target.value) || 1)} />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Fluxo de pagamento</Label>
                  <Select value={fluxoImplantacao} onValueChange={(v: "a_vista" | "parcelado") => setFluxoImplantacao(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a_vista">À vista</SelectItem>
                      <SelectItem value="parcelado">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {fluxoImplantacao === "parcelado" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Parcelas</Label>
                    <Input type="number" min={2} max={24} value={parcelasImplantacao} onChange={e => setParcelasImplantacao(Number(e.target.value) || 2)} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 6. Parceiro */}
          {partners.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-violet-500" /> Parceiro Indicador</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={parceiroId} onValueChange={setParceiroId}>
                  <SelectTrigger><SelectValue placeholder="Nenhum parceiro" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* 7. Forma de Pagamento */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-500" /> Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formaPagamentoId} onValueChange={setFormaPagamentoId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {formasAtivas.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 8. Observações */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} placeholder="Observações internas da proposta..." />
            </CardContent>
          </Card>

          {/* Sugestões */}
          <PropostaSugestoes
            planoSelecionado={plano || null}
            planos={planosAtivos}
            mensalidadeBase={calc.mensalidadeBase}
            distanciaKm={distanciaKm}
            modulosSelecionadosCount={moduloIds.length}
            parceiroSelecionado={!!parceiroId && parceiroId !== "none"}
            comissaoImplantacao={calc.comissaoImpl}
            comissaoRecorrente={calc.comissaoRecur}
          />
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:block space-y-4">
          <PropostaResumoLateral data={resumoData} onGerarProposta={handleGerarProposta} gerando={gerando} />
          <ConsultoraComercialIA
            sistemaValor={calc.sistemaValor}
            modulosValor={calc.modulosValor}
            modulosCount={moduloIds.length}
            modulosDisponiveis={modulosDoSistema.length}
            mensalidadeBase={calc.mensalidadeBase}
            mensalidadeFinal={calc.mensalidadeFinal}
            implantacaoTotal={calc.implantacaoTotal}
            descontoPercent={calc.descontoPercent}
            comissaoImpl={calc.comissaoImpl}
            comissaoRecur={calc.comissaoRecur}
            distanciaKm={distanciaKm}
            dias={dias}
            regiaoNome={regiao?.name || ""}
            parceiroNome={parceiro?.name || ""}
            planoNome={plano?.nomePlano || ""}
            sistemaName={sistema?.nome || ""}
            fluxoImplantacao={fluxoImplantacao}
            parcelasImplantacao={parcelasImplantacao}
            planosDisponiveis={planosAtivos.map(p => ({ nome: p.nomePlano, desconto: p.descontoPercentual, meses: p.validadeMeses }))}
          />
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Valor total</p>
            <p className="text-lg font-bold text-primary">
              R$ {(calc.mensalidadeFinal + calc.implantacaoTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <Button onClick={handleGerarProposta} disabled={gerando} className="gap-1.5">
            {gerando ? "Gerando..." : "Gerar Proposta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
