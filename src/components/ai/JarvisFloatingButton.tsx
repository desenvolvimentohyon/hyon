import { useState } from "react";
import { JarvisAvatar, type JarvisState } from "@/components/ai/JarvisAvatar";
import { AiExecutiveAssistant } from "@/components/ai/AiExecutiveAssistant";
import { useJarvisVoice } from "@/hooks/useJarvisVoice";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function JarvisFloatingButton() {
  const [open, setOpen] = useState(false);
  const voice = useJarvisVoice();

  const state: JarvisState = voice.isSpeaking
    ? "speaking"
    : voice.isListening
    ? "listening"
    : "idle";

  return (
    <>
      {/* FAB flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        <JarvisAvatar
          state={state}
          size="md"
          onClick={() => setOpen(true)}
        />
      </div>

      {/* Painel lateral */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Jarvis — Assistente IA</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <AiExecutiveAssistant />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
