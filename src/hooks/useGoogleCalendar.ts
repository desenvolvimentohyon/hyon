import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleCalendarState {
  connected: boolean;
  google_email: string | null;
  loading: boolean;
}

export function useGoogleCalendar() {
  const [state, setState] = useState<GoogleCalendarState>({ connected: false, google_email: null, loading: true });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const { data, error } = await supabase.functions.invoke("google-calendar-sync", { body: { action: "status" } });
    if (error) {
      setState({ connected: false, google_email: null, loading: false });
      return;
    }
    setState({ connected: !!data?.connected, google_email: data?.google_email || null, loading: false });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const connect = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("google-oauth-start", {
      body: { origin: window.location.origin },
    });
    if (error || !data?.authUrl) throw new Error("Falha ao iniciar OAuth Google");

    return new Promise<{ success: boolean; message?: string }>((resolve) => {
      const w = 500, h = 620;
      const y = window.top ? window.top.outerHeight / 2 + window.top.screenY - h / 2 : 0;
      const x = window.top ? window.top.outerWidth / 2 + window.top.screenX - w / 2 : 0;
      const popup = window.open(data.authUrl, "google-oauth", `width=${w},height=${h},top=${y},left=${x}`);

      const listener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === "google-oauth-success") {
          window.removeEventListener("message", listener);
          refresh();
          resolve({ success: true, message: event.data.message });
        } else if (event.data?.type === "google-oauth-error") {
          window.removeEventListener("message", listener);
          resolve({ success: false, message: event.data.message });
        }
      };
      window.addEventListener("message", listener);

      const poll = setInterval(() => {
        if (popup?.closed) {
          clearInterval(poll);
          window.removeEventListener("message", listener);
          setTimeout(() => refresh(), 500);
          resolve({ success: false, message: "Janela fechada" });
        }
      }, 500);
    });
  }, [refresh]);

  const disconnect = useCallback(async () => {
    await supabase.functions.invoke("google-calendar-sync", { body: { action: "disconnect" } });
    await refresh();
  }, [refresh]);

  const syncMeeting = useCallback(async (meetingId: string) => {
    const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
      body: { action: "create-event", meeting_id: meetingId },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as { ok: boolean; event_id: string; html_link?: string };
  }, []);

  return { ...state, connect, disconnect, syncMeeting, refresh };
}
