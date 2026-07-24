import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, Unlink } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { toast } from "sonner";

export default function GoogleCalendarConnectCard() {
  const { connected, google_email, loading, connect, disconnect } = useGoogleCalendar();
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    try {
      const r = await connect();
      if (r.success) toast.success(r.message || "Conta conectada!");
      else if (r.message && r.message !== "Janela fechada") toast.error(r.message);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  const handleDisconnect = async () => {
    setBusy(true);
    await disconnect();
    toast.success("Conta desconectada.");
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">Status:</span>
          {loading ? (
            <Badge variant="secondary">Verificando…</Badge>
          ) : connected ? (
            <>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Conectado</Badge>
              {google_email && <span className="text-sm text-muted-foreground">{google_email}</span>}
            </>
          ) : (
            <Badge variant="secondary">Desconectado</Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Conecte sua conta Google para que ao criar uma reunião no sistema, ela seja automaticamente adicionada ao seu Google Calendar
          e um convite seja enviado por e-mail para os participantes.
        </p>

        <div className="flex flex-wrap gap-2">
          {!connected ? (
            <Button onClick={handleConnect} disabled={busy || loading} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              Conectar Google Calendar
            </Button>
          ) : (
            <Button variant="outline" onClick={handleDisconnect} disabled={busy} className="gap-2">
              <Unlink className="h-4 w-4" />
              Desconectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
