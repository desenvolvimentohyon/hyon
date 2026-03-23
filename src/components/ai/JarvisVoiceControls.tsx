import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, MicOff, Volume2, VolumeX, Pause, Play, Square } from "lucide-react";

interface Props {
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  ttsSupported: boolean;
  sttSupported: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onReadBriefing: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
}

export function JarvisVoiceControls({
  isSpeaking, isListening, transcript,
  ttsSupported, sttSupported, voiceEnabled,
  onToggleVoice, onReadBriefing,
  onStartListening, onStopListening,
  onStopSpeaking, onPauseSpeaking, onResumeSpeaking,
}: Props) {
  if (!ttsSupported && !sttSupported) return null;

  return (
    <div className="flex items-center gap-1">
      {/* Mic button */}
      {sttSupported && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${isListening ? "text-destructive jarvis-listening" : ""}`}
              onClick={isListening ? onStopListening : onStartListening}
            >
              {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isListening ? "Parar escuta" : "Falar com Jarvis"}</TooltipContent>
        </Tooltip>
      )}

      {/* Read briefing */}
      {ttsSupported && voiceEnabled && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReadBriefing}>
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ouvir resumo</TooltipContent>
        </Tooltip>
      )}

      {/* Stop / Pause while speaking */}
      {isSpeaking && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPauseSpeaking}>
                <Pause className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pausar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStopSpeaking}>
                <Square className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Parar</TooltipContent>
          </Tooltip>
        </>
      )}

      {/* Mute toggle */}
      {ttsSupported && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60" onClick={onToggleVoice}>
              {voiceEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{voiceEnabled ? "Desativar voz" : "Ativar voz"}</TooltipContent>
        </Tooltip>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-1.5 ml-1">
          <div className="flex items-center gap-0.5">
            <span className="w-1 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-destructive rounded-full animate-pulse [animation-delay:150ms]" />
            <span className="w-1 h-2 bg-destructive rounded-full animate-pulse [animation-delay:300ms]" />
            <span className="w-1 h-3.5 bg-destructive rounded-full animate-pulse [animation-delay:100ms]" />
          </div>
          <span className="text-[10px] text-muted-foreground max-w-32 truncate">
            {transcript || "Ouvindo..."}
          </span>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && !isListening && (
        <div className="flex items-center gap-1.5 ml-1">
          <div className="flex items-center gap-0.5 jarvis-speaking-wave">
            <span className="w-1 h-2 bg-primary rounded-full" />
            <span className="w-1 h-3 bg-primary rounded-full" />
            <span className="w-1 h-2.5 bg-primary rounded-full" />
            <span className="w-1 h-3.5 bg-primary rounded-full" />
          </div>
          <span className="text-[10px] text-primary">Falando...</span>
        </div>
      )}
    </div>
  );
}
