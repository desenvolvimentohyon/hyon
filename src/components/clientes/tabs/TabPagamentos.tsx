import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Trash2, FileText, Loader2 } from "lucide-react";
import { usePaymentReceipts, type NewPaymentReceipt } from "@/hooks/usePaymentReceipts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  clienteId: string;
}

const METHODS = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outros", label: "Outros" },
];

export default function TabPagamentos({ clienteId }: Props) {
  const { receipts, loading, addReceipt, deleteReceipt, getFileUrl } = usePaymentReceipts(clienteId);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [paymentType, setPaymentType] = useState("parcela");
  const [planType, setPlanType] = useState("mensal");
  const [competency, setCompetency] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("pix");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setPaymentType("parcela");
    setPlanType("mensal");
    setCompetency("");
    setPeriodStart("");
    setPeriodEnd("");
    setAmount("");
    setPaidAt(new Date().toISOString().slice(0, 10));
    setMethod("pix");
    setNotes("");
    setFile(null);
  };

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({ title: "Informe o valor", variant: "destructive" });
      return;
    }
    setSaving(true);

    const receipt: NewPaymentReceipt = {
      payment_type: paymentType,
      plan_type: paymentType === "plano" ? planType : null,
      competency: paymentType === "parcela" ? competency || null : null,
      period_start: paymentType === "plano" ? periodStart || null : null,
      period_end: paymentType === "plano" ? periodEnd || null : null,
      amount: Number(amount),
      paid_at: paidAt,
      method,
      notes: notes || null,
    };

    const ok = await addReceipt(receipt, file);

    if (ok && paymentType === "plano") {
      // Update client billing plan
      const planMonths: Record<string, number> = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };
      const startDate = periodStart || paidAt;
      const endDate = periodEnd || (() => {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + (planMonths[planType] || 1));
        return d.toISOString().slice(0, 10);
      })();

      await supabase.from("clients").update({
        billing_plan: planType,
        plan_start_date: startDate,
        plan_end_date: endDate,
      } as any).eq("id", clienteId);
    }

    if (ok) {
      resetForm();
      setOpen(false);
    }
    setSaving(false);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getFileUrl(filePath);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = (d: string) => {
    try { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pagamentos</h3>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Registrar Pagamento
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : receipts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum pagamento registrado.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Período/Competência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{fmtDate(r.paid_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {r.payment_type === "plano" ? `Plano ${r.plan_type || ""}` : "Parcela"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.competency || (r.period_start && r.period_end ? `${fmtDate(r.period_start)} — ${fmtDate(r.period_end)}` : "—")}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{fmt(r.amount)}</TableCell>
                  <TableCell className="text-xs">{METHODS.find(m => m.value === r.method)?.label || r.method}</TableCell>
                  <TableCell>
                    {r.file_path ? (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleDownload(r.file_path!, r.file_name || "comprovante")}>
                        <Download className="h-3.5 w-3.5" /> {r.file_name ? r.file_name.slice(0, 15) : "Baixar"}
                      </Button>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteReceipt(r.id, r.file_path)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Tipo de Pagamento</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parcela">Parcela</SelectItem>
                    <SelectItem value="plano">Plano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentType === "plano" && (
                <div>
                  <Label>Plano</Label>
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {paymentType === "parcela" ? (
              <div>
                <Label>Competência (AAAA-MM)</Label>
                <Input value={competency} onChange={e => setCompetency(e.target.value)} placeholder="2026-03" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Início do Período</Label><Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} /></div>
                <div><Label>Fim do Período</Label><Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} /></div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Valor (R$)</Label><CurrencyInput value={Number(amount) || 0} onValueChange={v => setAmount(String(v))} /></div>
              <div><Label>Data do Pagamento</Label><Input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} /></div>
            </div>

            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>

            <div>
              <Label>Comprovante (arquivo)</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.png,.jpg,.jpeg,.webp" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
