import { useState } from "react";
import { useCardRevenue } from "@/hooks/useCardRevenue";
import { useCardClients } from "@/hooks/useCardClients";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, DollarSign, TrendingUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CardFaturamento() {
  const { revenue, commissions, createRevenue, updateCommissionStatus } = useCardRevenue();
  const { data: clients } = useCardClients();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ card_client_id: "", competency: "", gross_volume: 0, notes: "" });

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const totalRevMonth = (revenue.data || []).filter((r: any) => r.competency === currentMonth).reduce((s: number, r: any) => s + Number(r.gross_volume), 0);
  const totalCommMonth = (commissions.data || []).filter((c: any) => c.competency === currentMonth).reduce((s: number, c: any) => s + Number(c.commission_value), 0);

  const handleCreate = async () => {
    if (!form.card_client_id || !form.competency || form.gross_volume <= 0) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await createRevenue.mutateAsync(form);
      toast.success("Faturamento registrado e comissão calculada!");
      setDialogOpen(false);
      setForm({ card_client_id: "", competency: "", gross_volume: 0, notes: "" });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleMarkPaid = async (id: string) => {
    await updateCommissionStatus.mutateAsync({ id, status: "pago", paid_at: new Date().toISOString().split("T")[0] });
    toast.success("Comissão marcada como paga!");
  };

  const handleConfirm = async (id: string) => {
    await updateCommissionStatus.mutateAsync({ id, status: "confirmado" });
    toast.success("Comissão confirmada!");
  };

  if (revenue.isLoading) {
    return <div className="p-6"><Skeleton className="h-[400px] w-full rounded-xl" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Faturamento & Comissão" subtitle="Gestão de receita das maquininhas" actions={
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Lançar Faturamento
        </Button>
      } />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2">
        <Card className="neon-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><DollarSign className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Faturamento Mês</p>
              <p className="text-xl font-bold">{fmt(totalRevMonth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="neon-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Comissão Prevista</p>
              <p className="text-xl font-bold text-emerald-600">{fmt(totalCommMonth)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="faturamento" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="faturamento">
          <Card className="neon-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Volume Bruto</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(revenue.data || []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.card_clients?.name || "—"}</TableCell>
                      <TableCell>{r.competency}</TableCell>
                      <TableCell>{fmt(r.gross_volume)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {(revenue.data || []).length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">Nenhum lançamento</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comissoes">
          <Card className="neon-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(commissions.data || []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.card_clients?.name || "—"}</TableCell>
                      <TableCell>{c.competency}</TableCell>
                      <TableCell>{fmt(c.gross_volume)}</TableCell>
                      <TableCell>{c.commission_percent}%</TableCell>
                      <TableCell className="font-semibold text-emerald-600">{fmt(c.commission_value)}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "pago" ? "default" : c.status === "confirmado" ? "secondary" : "outline"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {c.status === "previsto" && (
                            <Button variant="ghost" size="sm" onClick={() => handleConfirm(c.id)} className="text-xs h-7">Confirmar</Button>
                          )}
                          {c.status === "confirmado" && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(c.id)} className="text-xs h-7 text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Pagar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(commissions.data || []).length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Nenhuma comissão</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Lançar Faturamento</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={form.card_client_id} onValueChange={v => setForm(f => ({ ...f, card_client_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(clients || []).filter(c => c.status === "ativo").map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Competência (YYYY-MM) *</Label>
              <Input type="month" value={form.competency} onChange={e => setForm(f => ({ ...f, competency: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Volume Bruto (R$) *</Label>
              <Input type="number" step="0.01" value={form.gross_volume} onChange={e => setForm(f => ({ ...f, gross_volume: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-sm">
              <p className="text-emerald-700 dark:text-emerald-300">
                Comissão prevista: <strong>{fmt(form.gross_volume * 0.3)}</strong> (30%)
              </p>
            </div>
            <Button onClick={handleCreate} disabled={createRevenue.isPending} className="w-full">
              {createRevenue.isPending ? "Salvando..." : "Registrar Faturamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
