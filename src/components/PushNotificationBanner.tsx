import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const DISMISSED_KEY = "push-banner-dismissed";

export function PushNotificationBanner() {
  const { supported, permission, isSubscribed, loading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  if (!supported || isSubscribed || permission === "denied" || dismissed || loading) return null;

  const handleActivate = async () => {
    const result = await subscribe();
    if (result?.success) {
      toast.success("Notificações push ativadas!");
      setDismissed(true);
    } else if (result?.denied) {
      toast.error("Notificações foram bloqueadas. Ative nas configurações do navegador.");
      setDismissed(true);
      localStorage.setItem(DISMISSED_KEY, "true");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  return (
    <Card className="mx-4 mt-2 md:mx-6 lg:mx-8 border-primary/20 bg-primary/5">
      <CardContent className="p-3 flex items-center gap-3">
        <Bell className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm text-foreground flex-1">
          Ative as notificações para receber alertas importantes no seu celular.
        </p>
        <Button size="sm" onClick={handleActivate} className="shrink-0">
          Ativar notificações
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
