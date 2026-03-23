import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface JarvisCommand {
  intent: "navigate" | "create" | "query" | "action" | "unknown";
  route?: string;
  entity_type?: string;
  entity_name?: string;
  params?: Record<string, string>;
  requires_confirmation?: boolean;
  confirmation_message?: string;
  spoken_response: string;
  fallback_chat?: boolean;
}

interface CommandHistoryEntry {
  text: string;
  command: JarvisCommand;
  timestamp: Date;
}

export function useJarvisCommands() {
  const navigate = useNavigate();
  const location = useLocation();
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    command: JarvisCommand;
    originalText: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const interpretCommand = useCallback(async (text: string): Promise<JarvisCommand | null> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-consultant", {
        body: {
          type: "command",
          text,
          currentRoute: location.pathname,
          permissions: [],
        },
      });
      if (error) throw error;
      return data as JarvisCommand;
    } catch {
      toast.error("Erro ao interpretar comando.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [location.pathname]);

  const executeCommand = useCallback((command: JarvisCommand, originalText: string) => {
    // Add to history
    setCommandHistory(prev => [
      { text: originalText, command, timestamp: new Date() },
      ...prev.slice(0, 19),
    ]);

    if (command.requires_confirmation) {
      setPendingConfirmation({ command, originalText });
      return;
    }

    switch (command.intent) {
      case "navigate":
        if (command.route) {
          navigate(command.route);
          toast.success(command.spoken_response);
        }
        break;

      case "create":
        if (command.route) {
          const separator = command.route.includes("?") ? "&" : "?";
          navigate(`${command.route}${separator}new=1`);
          toast.success(command.spoken_response);
        } else if (command.entity_type) {
          const routeMap: Record<string, string> = {
            cliente: "/clientes?new=1",
            proposta: "/propostas?new=1",
            tarefa: "/tarefas?new=1",
          };
          const route = routeMap[command.entity_type];
          if (route) {
            navigate(route);
            toast.success(command.spoken_response);
          }
        }
        break;

      case "action":
        toast.info(command.spoken_response);
        break;

      case "unknown":
        // Will be handled by caller
        break;
    }
  }, [navigate]);

  const confirmPending = useCallback(() => {
    if (!pendingConfirmation) return;
    const { command } = pendingConfirmation;
    setPendingConfirmation(null);

    // Execute without confirmation check
    if (command.intent === "navigate" && command.route) {
      navigate(command.route);
    } else if (command.intent === "create" && command.route) {
      navigate(command.route);
    }
    toast.success(command.spoken_response);
  }, [pendingConfirmation, navigate]);

  const cancelPending = useCallback(() => {
    setPendingConfirmation(null);
    toast.info("Comando cancelado.");
  }, []);

  return {
    interpretCommand,
    executeCommand,
    confirmPending,
    cancelPending,
    pendingConfirmation,
    commandHistory,
    isProcessing,
  };
}
