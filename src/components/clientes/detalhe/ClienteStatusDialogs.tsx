import { useState } from "react";
import { Loader2, Ban } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Props {
  cliente: any;
  updateCliente: (changes: any) => Promise<any>;
  showInativar: boolean;
  setShowInativar: (v: boolean) => void;
  showReativar: boolean;
  setShowReativar: (v: boolean) => void;
}

export function ClienteStatusDialogs({ cliente, updateCliente, showInativar, setShowInativar, showReativar, setShowReativar }: Props) {
  const [motivoInativacao, setMotivoInativacao] = useState("");
  const [inativando, setInativando] = useState(false);
  const [reativando, setReativando] = useState(false);

  return (
    <>
      {(cliente.status === "inativo" || cliente.status === "cancelado") && cliente.cancellation_reason && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <Ban className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm">
            <span className="font-medium">Motivo da inativação:</span> {cliente.cancellation_reason}
            {cliente.cancelled_at && (
              <span className="text-muted-foreground ml-2">
                — {new Date(cliente.cancelled_at).toLocaleDateString("pt-BR")}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <AlertDialog open={showInativar} onOpenChange={setShowInativar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação marcará o cliente como <strong>inativo</strong> e desativará a recorrência. Informe o motivo da inativação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo da inativação (obrigatório)"
            value={motivoInativacao}
            onChange={(e) => setMotivoInativacao(e.target.value)}
            className="min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={inativando} onClick={() => setMotivoInativacao("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!motivoInativacao.trim() || inativando}
              onClick={async (e) => {
                e.preventDefault();
                setInativando(true);
                const ok = await updateCliente({
                  status: "inativo",
                  cancellation_reason: motivoInativacao.trim(),
                  cancelled_at: new Date().toISOString(),
                  recurrence_active: false,
                });
                setInativando(false);
                if (ok) {
                  setShowInativar(false);
                  setMotivoInativacao("");
                  toast({ title: "Cliente inativado com sucesso" });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {inativando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar Inativação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReativar} onOpenChange={setShowReativar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja reativar <strong>{cliente.name}</strong>? O status voltará para <strong>ativo</strong>.
              {cliente.cancellation_reason && (
                <span className="block mt-2 p-2 rounded bg-muted text-xs">
                  <strong>Motivo da inativação:</strong> {cliente.cancellation_reason}
                  {cliente.cancelled_at && ` — ${new Date(cliente.cancelled_at).toLocaleDateString("pt-BR")}`}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reativando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={reativando}
              onClick={async (e) => {
                e.preventDefault();
                setReativando(true);
                const ok = await updateCliente({
                  status: "ativo",
                  cancellation_reason: null,
                  cancelled_at: null,
                  recurrence_active: true,
                });
                setReativando(false);
                if (ok) {
                  setShowReativar(false);
                  toast({ title: "Cliente reativado com sucesso" });
                }
              }}
            >
              {reativando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar Reativação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
