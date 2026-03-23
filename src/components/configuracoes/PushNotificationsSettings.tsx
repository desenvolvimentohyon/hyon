import { useState, useEffect } from "react";
import { Bell, BellOff, Send, Smartphone, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Device {
  id: string;
  device_name: string | null;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PushNotificationsSettings() {
  const { supported, permission, isSubscribed, loading, subscribe, unsubscribe, sendTest, refresh } = usePushNotifications();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const { data } = await supabase.functions.invoke("push-notifications", {
        body: { action: "devices" },
      });
      setDevices(data?.devices || []);
    } catch {
      // silent
    }
    setLoadingDevices(false);
  };

  useEffect(() => {
    loadDevices();
  }, [isSubscribed]);

  const handleActivate = async () => {
    const result = await subscribe();
    if (result?.success) {
      toast.success("Notificações push ativadas!");
      loadDevices();
    } else if (result?.denied) {
      toast.error("As notificações foram desativadas. Você pode ativá-las nas configurações do navegador.");
    }
  };

  const handleDeactivate = async () => {
    await unsubscribe();
    toast.success("Notificações desativadas para este dispositivo.");
    loadDevices();
  };

  const handleTest = async () => {
    setTestLoading(true);
    try {
      const result = await sendTest();
      if (result?.sent > 0) {
        toast.success(`Notificação de teste enviada para ${result.sent} dispositivo(s)!`);
      } else {
        toast.error("Nenhum dispositivo registrado para receber a notificação.");
      }
    } catch {
      toast.error("Erro ao enviar notificação de teste.");
    }
    setTestLoading(false);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    // Find device endpoint to unsubscribe
    await supabase.from("push_subscriptions").delete().eq("id", deviceId);
    toast.success("Dispositivo removido.");
    loadDevices();
    refresh();
  };

  const statusLabel = !supported
    ? { text: "Não suportado", variant: "secondary" as const }
    : permission === "denied"
    ? { text: "Bloqueado", variant: "destructive" as const }
    : isSubscribed
    ? { text: "Ativado", variant: "default" as const }
    : { text: "Desativado", variant: "secondary" as const };

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Status das Notificações Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={statusLabel.variant}>{statusLabel.text}</Badge>
          </div>

          {!supported && (
            <p className="text-sm text-muted-foreground">
              Seu navegador não suporta notificações push. Tente usar o Chrome ou Firefox em um dispositivo móvel.
            </p>
          )}

          {permission === "denied" && (
            <p className="text-sm text-destructive">
              As notificações foram bloqueadas pelo navegador. Para ativá-las, acesse as configurações do navegador e permita notificações para este site.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {supported && !isSubscribed && permission !== "denied" && (
              <Button onClick={handleActivate} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                Ativar notificações
              </Button>
            )}
            {isSubscribed && (
              <>
                <Button variant="outline" onClick={handleDeactivate} disabled={loading} className="gap-2">
                  <BellOff className="h-4 w-4" />
                  Desativar
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={testLoading} className="gap-2">
                  {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar notificação de teste
                </Button>
                <Button variant="outline" onClick={handleActivate} disabled={loading} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reinscrever dispositivo
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Devices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Dispositivos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registrado em</TableHead>
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingDevices ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum dispositivo registrado
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.device_name || "Dispositivo"}</TableCell>
                    <TableCell>
                      {d.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(d.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveDevice(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
