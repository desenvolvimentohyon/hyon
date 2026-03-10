import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePropostas } from "@/contexts/PropostasContext";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { gerarPDFProposta } from "@/lib/pdfGenerator";
import { Save, Send, Download, Copy, ExternalLink, ArrowLeft, Plus, Trash2, Clock, Handshake, MessageCircle } from "lucide-react";
import { Proposta, SistemaProposta, FluxoPagamento, StatusVisualizacao, StatusAceite, STATUS_VISUALIZACAO_LABELS, STATUS_ACEITE_LABELS } from "@/types/propostas";
import { supabase } from "@/integrations/supabase/client";
import { useParametros } from "@/contexts/ParametrosContext";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return "55" + digits;
}

interface PartnerOption {
  id: string;
  name: string;
  commission_percent: number;
  commission_implant_percent: number;
  commission_recur_percent: number;
  commission_recur_months: number;
  commission_recur_apply_on: string;
  commission_type: string;
}

export default function PropostaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { propostas, crmConfig, loading, updateProposta, cloneProposta, getProposta } = usePropostas();
  const { clientes } = useApp();

  const [form, setForm] = useState<Partial<Proposta>>({});
  const [enviarOpen, setEnviarOpen] = useState(false);
  const [mensagemEnvio, setMensagemEnvio] = useState("");
  const [partners, setPartners] = useState<PartnerOption[]>([]);

  useEffect(() => {
    supabase.from("partners").select("id, name, commission_percent, commission_implant_percent, commission_recur_percent, commission_recur_months, commission_recur_apply_on, commission_type").eq("active", true).order("name").then(({ data }) => {
      if (data) setPartners(data as any);
    });
  }, []);

  const proposta = getProposta(id || "");

  useEffect(() => {
    if (proposta) {
      setForm({ ...proposta });
    }
  }, [proposta?.id, proposta?.atualizadoEm]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-[500px]" /></div>;
  if (!proposta) return <div className="text-center py-20 text-muted-foreground">Proposta não encontrada<br /><Button variant="link" onClick={() => navigate("/propostas")}>Voltar</Button></div>;

  const set = (key: keyof Proposta, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    const { id: _, historico: __, criadoEm: ___, ...changes } = form;
    updateProposta(proposta.id, changes as Partial<Proposta>, "Edição");
    toast({ title: "Proposta salva!" });
  };

  const buildWhatsAppMessage = () => {
    const link = `${window.location.origin}${proposta.linkAceite}`;
    return `Olá *${form.clienteNomeSnapshot || ""}*, tudo bem?\n\nPreparamos sua proposta para o sistema *${form.sistema || ""}*.\n\nSegue o link para visualizar todos os detalhes e realizar o aceite:\n${link}\n\nResumo da proposta:\n📋 Implantação: ${fmt(form.valorImplantacao || 0)}\n💰 Mensalidade: ${fmt(form.valorMensalidade || 0)}\n\nQualquer dúvida estou à disposição.\n\n${crmConfig.nomeEmpresa}`;
  };

  const handleEnviar = () => {
    setMensagemEnvio(buildWhatsAppMessage());
    setEnviarOpen(true);
  };

  const handleOpenWhatsApp = () => {
    // Find client phone
    const cliente = clientes.find(c => c.id === form.clienteId);
    const phone = cliente?.telefone;
    if (!phone) {
      toast({ title: "Telefone do cliente não cadastrado", variant: "destructive" });
      return;
    }
    const cleanedPhone = cleanPhone(phone);
    const encoded = encodeURIComponent(mensagemEnvio);
    window.open(`https://wa.me/${cleanedPhone}?text=${encoded}`, "_blank");

    // Update proposal status
    const now = new Date();
    const validade = new Date(now);
    validade.setDate(validade.getDate() + (form.validadeDias || crmConfig.validadePadraoDias));
    updateProposta(proposta.id, {
      ...form,
      dataEnvio: now.toISOString(),
      dataValidade: validade.toISOString(),
      statusVisualizacao: "enviado",
      statusCRM: "Enviada",
      whatsappSentAt: now.toISOString(),
      whatsappSendCount: (proposta.whatsappSendCount || 0) + 1,
    } as Partial<Proposta>, "Envio WhatsApp");
    setEnviarOpen(false);
    toast({ title: "Proposta aberta no WhatsApp!" });
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(mensagemEnvio);
    toast({ title: "Mensagem copiada!" });
  };

  const handlePDF = () => {
    gerarPDFProposta({ ...proposta, ...form } as Proposta, crmConfig);
    updateProposta(proposta.id, { pdfGeradoEm: new Date().toISOString() }, "PDF gerado");
    toast({ title: "PDF gerado!" });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${proposta.linkAceite}`);
    toast({ title: "Link copiado!" });
  };

  const handleClone = () => {
    const c = cloneProposta(proposta.id);
    if (c) { toast({ title: `Clonada: ${c.numeroProposta}` }); navigate(`/propostas/${c.id}`); }
  };

  const addItem = () => {
    const items = [...(form.itens || []), { id: Math.random().toString(36).slice(2), descricao: "", quantidade: 1, valor: 0 }];
    set("itens", items);
  };

  const removeItem = (itemId: string) => set("itens", (form.itens || []).filter(i => i.id !== itemId));

  const updateItem = (itemId: string, key: string, val: any) => {
    set("itens", (form.itens || []).map(i => i.id === itemId ? { ...i, [key]: val } : i));
  };

  const handlePartnerChange = (v: string) => {
    if (v === "none") {
      set("partnerId", null);
      set("partnerCommissionPercent", null);
      set("partnerCommissionValue", null);
      set("partnerCommissionImplantPercent", null);
      set("partnerCommissionImplantValue", null);
      set("partnerCommissionRecurPercent", null);
      set("partnerCommissionRecurMonths", null);
      set("partnerCommissionRecurApplyOn", null);
    } else {
      const partner = partners.find(p => p.id === v);
      if (!partner) return;
      const implPct = partner.commission_implant_percent || partner.commission_percent || 0;
      const implVal = form.valorImplantacao || 0;
      const implCommission = Math.round(implVal * implPct / 100 * 100) / 100;
      setForm(prev => ({
        ...prev,
        partnerId: v,
        partnerCommissionPercent: implPct,
        partnerCommissionValue: implCommission,
        partnerCommissionImplantPercent: implPct,
        partnerCommissionImplantValue: implCommission,
        partnerCommissionRecurPercent: partner.commission_type === "implantacao_e_mensalidade" ? partner.commission_recur_percent : null,
        partnerCommissionRecurMonths: partner.commission_type === "implantacao_e_mensalidade" ? partner.commission_recur_months : null,
        partnerCommissionRecurApplyOn: partner.commission_type === "implantacao_e_mensalidade" ? partner.commission_recur_apply_on : null,
      }));
    }
  };

  const recalcImplantCommission = (implVal: number) => {
    const pct = form.partnerCommissionImplantPercent || form.partnerCommissionPercent || 0;
    const commVal = Math.round(implVal * pct / 100 * 100) / 100;
    setForm(prev => ({
      ...prev,
      valorImplantacao: implVal,
      partnerCommissionValue: commVal,
      partnerCommissionImplantValue: commVal,
    }));
  };

  const recurEstimado = form.partnerCommissionRecurPercent && form.valorMensalidade
    ? Math.round(form.valorMensalidade * form.partnerCommissionRecurPercent / 100 * 100) / 100
    : 0;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/propostas")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-xl font-bold">{proposta.numeroProposta}</h1>
          <p className="text-xs text-muted-foreground">Criada em {new Date(proposta.criadoEm).toLocaleDateString("pt-BR")}</p>
        </div>
        <div className="flex-1" />
        <Badge className="bg-primary/10 text-primary">{proposta.statusCRM}</Badge>
      </div>

      {/* Action bar */}
      <Card>
        <CardContent className="py-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSave} className="gap-1.5"><Save className="h-3.5 w-3.5" />Salvar</Button>
          <Button size="sm" variant="outline" onClick={handleEnviar} className="gap-1.5"><MessageCircle className="h-3.5 w-3.5" />Enviar WhatsApp</Button>
          <Button size="sm" variant="outline" onClick={handlePDF} className="gap-1.5"><Download className="h-3.5 w-3.5" />PDF</Button>
          <Button size="sm" variant="outline" onClick={handleCopyLink} className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" />Link</Button>
          <Button size="sm" variant="outline" onClick={handleClone} className="gap-1.5"><Copy className="h-3.5 w-3.5" />Clonar</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Cliente */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Selecionar Cliente</Label>
              <Select value={form.clienteId || "none"} onValueChange={v => {
                if (v === "none") { set("clienteId", null); set("clienteNomeSnapshot", ""); }
                else { const c = clientes.find(x => x.id === v); set("clienteId", v); set("clienteNomeSnapshot", c?.nome || ""); }
              }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (rascunho)</SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nome (snapshot)</Label>
              <Input className="h-9" value={form.clienteNomeSnapshot || ""} onChange={e => set("clienteNomeSnapshot", e.target.value)} placeholder="Nome manual..." />
            </div>
          </CardContent>
        </Card>

        {/* Sistema */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Sistema / Plano</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Sistema</Label>
              <Select value={form.sistema || ""} onValueChange={v => set("sistema", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
                <SelectContent>
                  {sistemasAtivos.map(s => (
                    <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Plano</Label>
              <Input className="h-9" value={form.planoNome || ""} onChange={e => set("planoNome", e.target.value)} placeholder="Ex: Completo" />
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Valores</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Mensalidade (R$)</Label>
              <CurrencyInput className="h-9" value={form.valorMensalidade || 0} onValueChange={v => set("valorMensalidade", v)} />
            </div>
            <div>
              <Label className="text-xs">Implantação (R$)</Label>
              <CurrencyInput className="h-9" value={form.valorImplantacao || 0} onValueChange={v => {
                if (form.partnerId) recalcImplantCommission(v);
                else set("valorImplantacao", v);
              }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Fluxo</Label>
                <Select value={form.fluxoPagamentoImplantacao || "a_vista"} onValueChange={v => set("fluxoPagamentoImplantacao", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_vista">À vista</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.fluxoPagamentoImplantacao === "parcelado" && (
                <div>
                  <Label className="text-xs">Parcelas</Label>
                  <Input type="number" className="h-9" value={form.parcelasImplantacao || 1} onChange={e => set("parcelasImplantacao", Number(e.target.value))} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Status CRM</Label>
              <Select value={form.statusCRM || ""} onValueChange={v => set("statusCRM", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{crmConfig.statusKanban.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Visualização</Label>
              <Select value={form.statusVisualizacao || "nao_enviado"} onValueChange={v => set("statusVisualizacao", v as StatusVisualizacao)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.entries(STATUS_VISUALIZACAO_LABELS) as [StatusVisualizacao, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Aceite</Label>
              <Select value={form.statusAceite || "pendente"} onValueChange={v => set("statusAceite", v as StatusAceite)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.entries(STATUS_ACEITE_LABELS) as [StatusAceite, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Validade (dias)</Label>
              <Input type="number" className="h-9" value={form.validadeDias || 10} onChange={e => set("validadeDias", Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parceiro Indicador */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Handshake className="h-4 w-4 text-primary" /> Parceiro Indicador</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Parceiro</Label>
            <Select value={form.partnerId || "none"} onValueChange={handlePartnerChange}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Nenhum parceiro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {partners.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (Impl: {p.commission_implant_percent || p.commission_percent}%{p.commission_type === "implantacao_e_mensalidade" ? ` / Recor: ${p.commission_recur_percent}%` : ""})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.partnerId && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">% Comissão Implantação</Label>
                  <Input
                    type="number" className="h-9"
                    value={form.partnerCommissionImplantPercent ?? form.partnerCommissionPercent ?? 0}
                    onChange={e => {
                      const pct = Number(e.target.value);
                      const implVal = form.valorImplantacao || 0;
                      const commVal = Math.round(implVal * pct / 100 * 100) / 100;
                      setForm(prev => ({
                        ...prev,
                        partnerCommissionPercent: pct,
                        partnerCommissionImplantPercent: pct,
                        partnerCommissionValue: commVal,
                        partnerCommissionImplantValue: commVal,
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Comissão Implantação (R$)</Label>
                  <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm font-semibold text-primary">
                    {fmt(form.partnerCommissionImplantValue ?? form.partnerCommissionValue ?? 0)}
                  </div>
                </div>
              </div>

              {/* Recurrence section */}
              {form.partnerCommissionRecurPercent != null && form.partnerCommissionRecurPercent > 0 && (
                <div className="rounded-md border p-3 bg-muted/30 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Comissão Recorrente (Mensalidade)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">% Recorrente</Label>
                      <Input type="number" className="h-9" value={form.partnerCommissionRecurPercent || 0} onChange={e => set("partnerCommissionRecurPercent", Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-xs">Meses (0=∞)</Label>
                      <Input type="number" className="h-9" value={form.partnerCommissionRecurMonths ?? 0} onChange={e => set("partnerCommissionRecurMonths", Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-xs">Aplicar em</Label>
                      <Select value={form.partnerCommissionRecurApplyOn || "on_invoice_paid"} onValueChange={v => set("partnerCommissionRecurApplyOn", v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on_invoice_paid">Ao pagar</SelectItem>
                          <SelectItem value="on_invoice_created">Ao gerar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {recurEstimado > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Comissão recorrente estimada: <span className="font-semibold text-primary">{fmt(recurEstimado)}/mês</span>
                      {form.partnerCommissionRecurMonths && form.partnerCommissionRecurMonths > 0
                        ? ` por ${form.partnerCommissionRecurMonths} meses`
                        : " enquanto ativo"}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          {(form.commissionImplantGenerated || form.commissionGenerated) && (
            <Badge className="bg-success/10 text-success border-success/20">✓ Comissão de implantação já gerada</Badge>
          )}
        </CardContent>
      </Card>

      {/* Conteúdo */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Conteúdo da Proposta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Informações Adicionais</Label>
            <Textarea rows={3} value={form.informacoesAdicionais || ""} onChange={e => set("informacoesAdicionais", e.target.value)} placeholder="Texto que aparece no PDF e link..." />
          </div>
          <div>
            <Label className="text-xs">Observações Internas</Label>
            <Textarea rows={2} value={form.observacoesInternas || ""} onChange={e => set("observacoesInternas", e.target.value)} placeholder="Notas internas..." />
          </div>

          <Separator />
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Itens</Label>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3 w-3" />Item</Button>
          </div>
          {(form.itens || []).map(item => (
            <div key={item.id} className="flex gap-2 items-end">
              <div className="flex-1"><Input className="h-8" placeholder="Descrição" value={item.descricao} onChange={e => updateItem(item.id, "descricao", e.target.value)} /></div>
              <div className="w-16"><Input className="h-8" type="number" value={item.quantidade} onChange={e => updateItem(item.id, "quantidade", Number(e.target.value))} /></div>
              <div className="w-24"><CurrencyInput className="h-8" value={item.valor} onValueChange={v => updateItem(item.id, "valor", v)} /></div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Histórico</CardTitle></CardHeader>
        <CardContent>
          {proposta.historico.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem histórico</p>
          ) : (
            <div className="space-y-3">
              {[...proposta.historico].reverse().map(h => (
                <div key={h.id} className="flex items-start gap-3">
                  <Clock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{h.acao}</p>
                    {h.detalhes && <p className="text-xs text-muted-foreground">{h.detalhes}</p>}
                    <p className="text-[10px] text-muted-foreground">{new Date(h.criadoEm).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Send Dialog */}
      <Dialog open={enviarOpen} onOpenChange={setEnviarOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />Enviar Proposta via WhatsApp</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Mensagem (editável)</Label>
              <Textarea rows={8} value={mensagemEnvio} onChange={e => setMensagemEnvio(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyMessage} className="gap-1.5"><Copy className="h-3.5 w-3.5" />Copiar Mensagem</Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" />Copiar Link</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnviarOpen(false)}>Cancelar</Button>
            <Button onClick={handleOpenWhatsApp} className="gap-1.5"><MessageCircle className="h-3.5 w-3.5" />Abrir WhatsApp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
