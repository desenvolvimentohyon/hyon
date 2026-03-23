import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PushState {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
  loading: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    supported: false,
    permission: "unsupported",
    isSubscribed: false,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState((s) => ({ ...s, supported: false, loading: false }));
      return;
    }

    setState((s) => ({ ...s, supported: true, permission: Notification.permission }));

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState((s) => ({ ...s, isSubscribed: !!sub, loading: false }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const permission = await Notification.requestPermission();
      setState((s) => ({ ...s, permission }));

      if (permission !== "granted") {
        setState((s) => ({ ...s, loading: false }));
        return { success: false, denied: permission === "denied" };
      }

      // Get VAPID key
      const { data: vapidData } = await supabase.functions.invoke("push-notifications", {
        body: { action: "get-vapid-key" },
      });

      if (!vapidData?.vapidPublicKey) {
        throw new Error("VAPID key not available");
      }

      const reg = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(vapidData.vapidPublicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON();
      await supabase.functions.invoke("push-notifications", {
        body: {
          action: "subscribe",
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
          userAgent: navigator.userAgent,
          deviceName: getDeviceName(),
        },
      });

      setState((s) => ({ ...s, isSubscribed: true, loading: false }));
      return { success: true };
    } catch (err) {
      console.error("Push subscribe error:", err);
      setState((s) => ({ ...s, loading: false }));
      return { success: false, error: err };
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.functions.invoke("push-notifications", {
          body: { action: "unsubscribe", endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setState((s) => ({ ...s, isSubscribed: false, loading: false }));
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const sendTest = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("push-notifications", {
      body: { action: "test" },
    });
    if (error) throw error;
    return data;
  }, []);

  return { ...state, subscribe, unsubscribe, sendTest, refresh: checkSubscription };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) {
    const match = ua.match(/;\s*([^;)]+)\s*Build/);
    return match ? match[1].trim() : "Android";
  }
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Mac/i.test(ua)) return "Mac";
  return "Dispositivo";
}
