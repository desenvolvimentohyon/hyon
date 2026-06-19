import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { STATUS_TITULO_LABELS, ORIGEM_TITULO_LABELS, type TituloFinanceiro } from "@/types/financeiro";

interface Props {
  titulo: TituloFinanceiro | null;
  onClose: () => void;
  updateTitulo: (id: string, patch: Partial<TituloFinanceiro>) => any;
  deleteTitulo: (id: string) => any;
}

export function DetalheLancamentoDialog({ titulo, onClose, updateTitulo, deleteTitulo }: Props) {
  const [editForm, setEditForm] = useState({ descricao: "", valorOriginal: 0, vencimento: "", status: "", observacoes: "" });
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    if (titulo) setEditForm({ descricao: titulo.descricao, valorOriginal: titulo.valorOriginal, vencimento: titulo.vencimento || "", status: titulo.status, observacoes: titulo.observacoes });
  }, [titulo]);

  const salvar = async () => {
    if (!titulo) return;
    await updateTitulo(titulo.id, {
      descricao: editForm.descricao,
      valorOriginal: editForm.valorOriginal,
      vencimento: editForm.vencimento,
      status: editForm.status as TituloFinanceiro["status"],
      observacoes: editForm.observacoes,
    });
    toast.success("Lançamento atualizado!");
    onClose();
  };

  return (
    <>
      <Dialog open={!!titulo} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Lançamento</DialogTitle></DialogHeader>
          {titulo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{" "}
                  <Badge variant="outline" className={titulo.tipo === "receber" ? "bg-success/15 text-success border-success/20" : "bg-destructive/15 text-destructive border-destructive/20"}>
                    {titulo.tipo === "receber" ? "Receita" : "Despesa"}
                  </Badge>
                </div>
                <div><span className="text-muted-foreground">Origem:</span> {ORIGEM_TITULO_LABELS[titulo.origem] || titulo.origem}</div>
                <div><span className="text-muted-foreground">Emissão:</span> {new Date(titulo.dataEmissao).toLocaleDateString("pt-BR")}</div>
                <div><span className="text-muted-foreground">Competência:</span> {titulo.competenciaMes || "—"}</div>
              </div>
              <div className="space-y-3">
                <div><Label>Descrição</Label><Input value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} /></div>
                <div><Label>Valor</Label><CurrencyInput value={editForm.valorOriginal} onValueChange={v => setEditForm(f => ({ ...f, valorOriginal: v }))} /></div>
                <div>
                  <Label>{titulo.tipo === "pagar" ? "Data de Lançamento" : "Vencimento"}</Label>
                  <Input type="date" value={editForm.vencimento} onChange={e => setEditForm(f => ({ ...f, vencimento: e.target.value }))} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_TITULO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Observações</Label><Textarea value={editForm.observacoes} onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} /></div>
              </div>
            </div>
          )}
          <DialogFooter className="flex !justify-between">
            <Button variant="destructive" size="sm" onClick={() => setConfirmarExclusao(true)}><Trash2 className="h-4 w-4 mr-1" /> Excluir</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={salvar}>Salvar Alterações</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
            <AlertDialogDescription>Deseja realmente excluir este lançamento? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!titulo) return;
                await deleteTitulo(titulo.id);
                toast.success("Lançamento excluído com sucesso!");
                onClose();
                setConfirmarExclusao(false);
              }}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
