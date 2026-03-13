import { useState, useMemo } from "react";
import { usePropostas } from "@/contexts/PropostasContext";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { gerarPDFProposta } from "@/lib/pdfGenerator";
import { Plus, Search, MoreHorizontal, FileText, Copy, Download, Send, Eye, EyeOff, ThumbsUp, ThumbsDown, Trash2, ExternalLink, MessageCircle } from "lucide-react";
import { StatusVisualizacao, StatusAceite, SistemaProposta, STATUS_VISUALIZACAO_LABELS, STATUS_ACEITE_LABELS } from "@/types/propostas";

export default function Propostas() {
  const { propostas, crmConfig, loading, addProposta, updateProposta, deleteProposta, cloneProposta } = usePropostas();
  const { clientes } = useApp();
  const navigate = useNavigate();

  const [busca, setBusca] = useState("");
  const [filtroStatusCRM, setFiltroStatusCRM] = useState("todos");
  const [filtroVisualizacao, setFiltroVisualizacao] = useState("todos");
  const [filtroAceite, setFiltroAceite] = useState("todos");
  const [filtroSistema, setFiltroSistema] = useState("todos");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const now = new Date();

  const isExpirada = (p: { dataValidade: string | null; statusAceite: string }) => {
    if (!p.dataValidade || p.statusAceite === "aceitou") return false;
    return new Date(p.dataValidade) < now;
  };

  const filtered = useMemo(() => {
    return propostas.filter(p => {
      if (busca) {
        const q = busca.toLowerCase();
        if (!p.numeroProposta.toLowerCase().includes(q) && !p.clienteNomeSnapshot.toLowerCase().includes(q) && !p.sistema.toLowerCase().includes(q)) return false;
      }
      if (filtroStatusCRM !== "todos" && p.statusCRM !== filtroStatusCRM) return false;
      if (filtroVisualizacao !== "todos" && p.statusVisualizacao !== filtroVisualizacao) return false;
      if (filtroAceite !== "todos" && p.statusAceite !== filtroAceite) return false;
      if (filtroSistema !== "todos" && p.sistema !== filtroSistema) return false;
      return true;
    }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [propostas, busca, filtroStatusCRM, filtroVisualizacao, filtroAceite, filtroSistema]);

  const handleNova = () => {
    navigate("/propostas/nova");
  };

  const handleClone = (id: string) => {
    const c = cloneProposta(id);
    if (c) {
      toast({ title: `Proposta clonada: ${c.numeroProposta}` });
      navigate(`/propostas/${c.id}`);
    }
  };

  const handleMarcar = (id: string, changes: any, acao: string, label: string) => {
    updateProposta(id, changes, acao);
    toast({ title: label });
  };

  const handleEnviar = (id: string) => {
    const now = new Date();
    const p = propostas.find(x => x.id === id);
    if (!p) return;
    const validade = new Date(now);
    validade.setDate(validade.getDate() + p.validadeDias);
    handleMarcar(id, { dataEnvio: now.toISOString(), dataValidade: validade.toISOString(), statusVisualizacao: "enviado" as StatusVisualizacao, statusCRM: "Enviada" }, "Envio", "Proposta marcada como enviada!");
  };

  const handleWhatsApp = (id: string) => {
    const p = propostas.find(x => x.id === id);
    if (!p) return;
    const cliente = clientes.find(c => c.id === p.clienteId);
    const phone = cliente?.telefone;
    if (!phone) {
      toast({ title: "Telefone do cliente não cadastrado", variant: "destructive" });
      return;
    }
    const digits = phone.replace(/\D/g, "");
    const cleanedPhone = digits.startsWith("55") ? digits : "55" + digits;
    const link = `${window.location.origin}${p.linkAceite}`;
    const msg = `Olá *${p.clienteNomeSnapshot}*, tudo bem?\n\nPreparamos sua proposta para o sistema *${p.sistema}*.\n\nSegue o link:\n${link}\n\nImplantação: R$ ${p.valorImplantacao.toFixed(2)}\nMensalidade: R$ ${p.valorMensalidade.toFixed(2)}\n\n${crmConfig.nomeEmpresa}`;
    window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    const now = new Date();
    const validade = new Date(now);
    validade.setDate(validade.getDate() + p.validadeDias);
    updateProposta(id, {
      dataEnvio: now.toISOString(),
      dataValidade: validade.toISOString(),
      statusVisualizacao: "enviado" as StatusVisualizacao,
      statusCRM: "Enviada",
      whatsappSentAt: now.toISOString(),
      whatsappSendCount: (p.whatsappSendCount || 0) + 1,
    } as any, "Envio WhatsApp");
    toast({ title: "Proposta aberta no WhatsApp!" });
  };

  const handlePDF = (id: string) => {
    const p = propostas.find(x => x.id === id);
    if (!p) return;
    gerarPDFProposta(p, crmConfig);
    updateProposta(id, { pdfGeradoEm: new Date().toISOString() }, "PDF gerado");
    toast({ title: "PDF gerado e baixado!" });
  };

  const handleCopyLink = (id: string) => {
    const p = propostas.find(x => x.id === id);
    if (!p) return;
    const link = `${window.location.origin}${p.linkAceite}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const confirmDelete = () => {
    if (deleteId) { deleteProposta(deleteId); toast({ title: "Proposta excluída!" }); setDeleteId(null); }
  };

  const vizBadge = (s: StatusVisualizacao) => {
    const map: Record<StatusVisualizacao, string> = {
      nao_enviado: "bg-muted text-muted-foreground",
      enviado: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      visualizado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      nao_abriu: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    };
    return map[s];
  };

  const aceiteBadge = (s: StatusAceite) => {
    const map: Record<StatusAceite, string> = {
      pendente: "bg-muted text-muted-foreground",
      aceitou: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      recusou: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    };
    return map[s];
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Propostas</h1>
        <Button onClick={handleNova} className="gap-1.5"><Plus className="h-4 w-4" />Nova Proposta</Button>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por número, cliente, sistema..." className="pl-8 h-9" value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <Select value={filtroStatusCRM} onValueChange={setFiltroStatusCRM}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status CRM" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                {crmConfig.statusKanban.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroVisualizacao} onValueChange={setFiltroVisualizacao}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Visualização</SelectItem>
                {(["nao_enviado","enviado","visualizado","nao_abriu"] as StatusVisualizacao[]).map(s => <SelectItem key={s} value={s}>{STATUS_VISUALIZACAO_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroAceite} onValueChange={setFiltroAceite}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Aceite</SelectItem>
                {(["pendente","aceitou","recusou"] as StatusAceite[]).map(s => <SelectItem key={s} value={s}>{STATUS_ACEITE_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroSistema} onValueChange={setFiltroSistema}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Sistema</SelectItem>
                {(["HYON","LINKPRO","OUTRO"] as SistemaProposta[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead className="text-right">Mensalidade</TableHead>
                <TableHead className="text-right">Implantação</TableHead>
                <TableHead>Envio</TableHead>
                <TableHead>Visualização</TableHead>
                <TableHead>Aceite</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">Nenhuma proposta encontrada</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id} className="group cursor-pointer hover:bg-accent/40 transition-colors duration-150" onClick={() => navigate(`/propostas/${p.id}`)}>
                  <TableCell className="font-mono text-xs font-medium">{p.numeroProposta}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{p.clienteNomeSnapshot || <span className="text-muted-foreground italic">Sem cliente</span>}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{p.sistema}</Badge></TableCell>
                  <TableCell className="text-right font-medium">R$ {p.valorMensalidade.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div>R$ {p.valorImplantacao.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">{p.fluxoPagamentoImplantacao === "a_vista" ? "À vista" : `${p.parcelasImplantacao}x`}</div>
                  </TableCell>
                  <TableCell className="text-xs">{p.dataEnvio ? new Date(p.dataEnvio).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${vizBadge(p.statusVisualizacao)}`}>{STATUS_VISUALIZACAO_LABELS[p.statusVisualizacao]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-[10px] ${aceiteBadge(p.statusAceite)}`}>{STATUS_ACEITE_LABELS[p.statusAceite]}</Badge>
                      {isExpirada(p) && <Badge variant="destructive" className="text-[10px]">Expirada</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Badge className="text-[10px] bg-primary/10 text-primary">{p.statusCRM}</Badge></TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/propostas/${p.id}`)}><FileText className="h-3.5 w-3.5 mr-2" />Abrir</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleClone(p.id)}><Copy className="h-3.5 w-3.5 mr-2" />Clonar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePDF(p.id)}><Download className="h-3.5 w-3.5 mr-2" />Baixar PDF</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(p.id)}><ExternalLink className="h-3.5 w-3.5 mr-2" />Copiar Link</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleWhatsApp(p.id)}><MessageCircle className="h-3.5 w-3.5 mr-2" />Enviar via WhatsApp</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEnviar(p.id)}><Send className="h-3.5 w-3.5 mr-2" />Marcar Enviada</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarcar(p.id, { statusVisualizacao: "visualizado" as StatusVisualizacao }, "Visualização", "Marcada como visualizada!")}><Eye className="h-3.5 w-3.5 mr-2" />Marcar Visualizada</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarcar(p.id, { statusVisualizacao: "nao_abriu" as StatusVisualizacao }, "Não abriu", "Marcada como não abriu!")}><EyeOff className="h-3.5 w-3.5 mr-2" />Marcar Não Abriu</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleMarcar(p.id, { statusAceite: "aceitou" as const, statusCRM: "Aceita" }, "Aceite", "Proposta aceita!")}><ThumbsUp className="h-3.5 w-3.5 mr-2" />Marcar Aceita</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarcar(p.id, { statusAceite: "recusou" as const, statusCRM: "Recusada" }, "Recusa", "Proposta recusada!")}><ThumbsDown className="h-3.5 w-3.5 mr-2" />Marcar Recusada</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5 mr-2" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
