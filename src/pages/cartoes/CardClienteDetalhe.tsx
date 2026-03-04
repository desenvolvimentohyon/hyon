import { useParams, useNavigate } from "react-router-dom";
import { useCardClients, useCardFeeProfiles } from "@/hooks/useCardClients";
import { useCardProposals } from "@/hooks/useCardProposals";
import { useCardRevenue } from "@/hooks/useCardRevenue";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(2)}%`;

export default function CardClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: clients, isLoading, update } = useCardClients();
  const { data: fees, create: createFee } = useCardFeeProfiles(id);
  const { data: proposals } = useCardProposals();
  const { revenue, commissions } = useCardRevenue();

  const [feeDialog, setFeeDialog] = useState(false);
  const [feeForm, setFeeForm] = useState({ mdr_debito_percent: 0, mdr_credito_1x_percent: 0, mdr_credito_2a6_percent: 0, mdr_credito_7a12_percent: 0, antecipacao_percent: 0, prazo_repasse: 1, aluguel_mensal: 0 });
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const [erpClients, setErpClients] = useState<any[]>([]);

  const client = clients?.find(c => c.id === id);
  const clientProposals = proposals?.filter(p => p.card_client_id === id) || [];
  const clientRevenue = revenue.data?.filter((r: any) => r.card_client_id === id) || [];
  const clientCommissions = commissions.data?.filter((c: any) => c.card_client_id === id) || [];

  const searchErp = async () => {
    const { data } = await supabase.from("clients").select("id, name, document, city").or(`name.ilike.%${linkSearch}%,document.ilike.%${linkSearch}%`).limit(10);
    setErpClients(data || []);
  };

  const linkToErp = async (erpId: string) => {
    try {
      await update.mutateAsync({ id: id!, linked_client_id: erpId } as any);
      toast.success("Vinculado ao cliente ERP!");
      setLinkDialog(false);
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading || !client) {
    return <div className="p-6"><Skeleton className="h-[600px] w-full rounded-xl" /></div>;
  }

  const handleSaveFee = async () => {
    try {
      await createFee.mutateAsync(feeForm);
      toast.success("Taxas salvas!");
      setFeeDialog(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cartoes/clientes")}><ArrowLeft className="h-4 w-4" /></Button>
        <PageHeader title={client.name} subtitle={client.company_name || (client.card_machine_type === "fiscal" ? "Fiscal" : "Não Fiscal")} actions={
          !client.linked_client_id ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLinkDialog(true)}>
              <Link2 className="h-4 w-4" /> Vincular ao ERP
            </Button>
          ) : undefined
        } />
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="taxas">Taxas</TabsTrigger>
          <TabsTrigger value="propostas">Propostas</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="comissao">Comissão</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card className="neon-border">
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              {[
                ["Nome", client.name], ["Razão Social", client.company_name],
                ["CNPJ", client.cnpj], ["Telefone", client.phone],
                ["Email", client.email], ["Cidade", client.city],
                ["Status", client.status], ["Tipo Máquina", client.card_machine_type === "fiscal" ? "Fiscal" : "Não Fiscal"],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{(value as string) || "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxas">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold">Perfis de Taxas</h3>
            <Button size="sm" onClick={() => setFeeDialog(true)} className="gap-1"><Plus className="h-3.5 w-3.5" />Nova Taxa</Button>
          </div>
          <Card className="neon-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Débito</TableHead>
                    <TableHead>Crédito 1x</TableHead>
                    <TableHead>Crédito 2-6x</TableHead>
                    <TableHead>Crédito 7-12x</TableHead>
                    <TableHead>Antecipação</TableHead>
                    <TableHead>Repasse</TableHead>
                    <TableHead>Aluguel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(fees || []).map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell>{fmtPct(f.mdr_debito_percent)}</TableCell>
                      <TableCell>{fmtPct(f.mdr_credito_1x_percent)}</TableCell>
                      <TableCell>{fmtPct(f.mdr_credito_2a6_percent)}</TableCell>
                      <TableCell>{fmtPct(f.mdr_credito_7a12_percent)}</TableCell>
                      <TableCell>{fmtPct(f.antecipacao_percent)}</TableCell>
                      <TableCell>D+{f.prazo_repasse}</TableCell>
                      <TableCell>{f.aluguel_mensal ? fmt(f.aluguel_mensal) : "—"}</TableCell>
                      <TableCell><Badge variant={f.active ? "default" : "outline"}>{f.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {(!fees || fees.length === 0) && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma taxa cadastrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="propostas">
          <Card className="neon-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientProposals.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title || "Sem título"}</TableCell>
                      <TableCell>{p.machine_type === "fiscal" ? "Fiscal" : "Não Fiscal"}</TableCell>
                      <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                  {clientProposals.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma proposta</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faturamento">
          <Card className="neon-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Volume Bruto</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientRevenue.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.competency}</TableCell>
                      <TableCell>{fmt(r.gross_volume)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {clientRevenue.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum faturamento</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comissao">
          <Card className="neon-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientCommissions.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.competency}</TableCell>
                      <TableCell>{fmt(c.gross_volume)}</TableCell>
                      <TableCell>{c.commission_percent}%</TableCell>
                      <TableCell className="font-semibold text-emerald-600">{fmt(c.commission_value)}</TableCell>
                      <TableCell><Badge variant={c.status === "pago" ? "default" : "outline"}>{c.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {clientCommissions.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma comissão</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fee Dialog */}
      <Dialog open={feeDialog} onOpenChange={setFeeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Cadastrar Taxas</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            {[
              ["mdr_debito_percent", "MDR Débito (%)"],
              ["mdr_credito_1x_percent", "MDR Crédito 1x (%)"],
              ["mdr_credito_2a6_percent", "MDR Crédito 2-6x (%)"],
              ["mdr_credito_7a12_percent", "MDR Crédito 7-12x (%)"],
              ["antecipacao_percent", "Antecipação (%)"],
            ].map(([key, label]) => (
              <div key={key} className="grid grid-cols-2 items-center gap-2">
                <Label>{label}</Label>
                <Input type="number" step="0.01" value={(feeForm as any)[key]} onChange={e => setFeeForm(f => ({ ...f, [key]: Number(e.target.value) }))} />
              </div>
            ))}
            <div className="grid grid-cols-2 items-center gap-2">
              <Label>Prazo Repasse (dias)</Label>
              <Input type="number" value={feeForm.prazo_repasse} onChange={e => setFeeForm(f => ({ ...f, prazo_repasse: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 items-center gap-2">
              <Label>Aluguel Mensal (R$)</Label>
              <Input type="number" step="0.01" value={feeForm.aluguel_mensal} onChange={e => setFeeForm(f => ({ ...f, aluguel_mensal: Number(e.target.value) }))} />
            </div>
            <Button onClick={handleSaveFee} disabled={createFee.isPending} className="w-full mt-2">{createFee.isPending ? "Salvando..." : "Salvar Taxas"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link to ERP Dialog */}
      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Vincular ao Cliente ERP</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Buscar por nome ou CNPJ..." value={linkSearch} onChange={e => setLinkSearch(e.target.value)} />
              <Button onClick={searchErp} size="sm">Buscar</Button>
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {erpClients.map(c => (
                <button key={c.id} onClick={() => linkToErp(c.id)} className="w-full text-left p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{[c.document, c.city].filter(Boolean).join(" · ")}</p>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
