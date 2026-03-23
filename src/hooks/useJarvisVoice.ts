import { useState, useEffect, useCallback, useRef } from "react";

interface JarvisVoiceConfig {
  voiceEnabled: boolean;
  autoWelcome: boolean;
  autoReadBriefing: boolean;
  voiceResponses: boolean;
  volume: number;
  rate: number;
}

const DEFAULTS: JarvisVoiceConfig = {
  voiceEnabled: true,
  autoWelcome: true,
  autoReadBriefing: false,
  voiceResponses: true,
  volume: 0.9,
  rate: 1.0,
};

function loadConfig(): JarvisVoiceConfig {
  try {
    const raw = localStorage.getItem("jarvis_voice_config");
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function saveConfig(cfg: JarvisVoiceConfig) {
  localStorage.setItem("jarvis_voice_config", JSON.stringify(cfg));
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function useJarvisVoice(onSpeechResult?: (text: string) => void) {
  const [config, setConfigState] = useState<JarvisVoiceConfig>(loadConfig);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [ttsSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [sttSupported] = useState(() => !!SpeechRecognitionAPI);
  const recognitionRef = useRef<any>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // pick best pt-BR voice
  useEffect(() => {
    if (!ttsSupported) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const ptVoices = voices.filter(v => v.lang.startsWith("pt"));
      selectedVoiceRef.current =
        ptVoices.find(v => /google|luciana|fernanda/i.test(v.name)) ||
        ptVoices[0] ||
        voices[0] ||
        null;
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pick);
  }, [ttsSupported]);

  const updateConfig = useCallback((partial: Partial<JarvisVoiceConfig>) => {
    setConfigState(prev => {
      const next = { ...prev, ...partial };
      saveConfig(next);
      return next;
    });
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!ttsSupported || !config.voiceEnabled || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoiceRef.current) utterance.voice = selectedVoiceRef.current;
      utterance.lang = "pt-BR";
      utterance.volume = config.volume;
      utterance.rate = config.rate;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [ttsSupported, config.voiceEnabled, config.volume, config.rate],
  );

  const stopSpeaking = useCallback(() => {
    if (ttsSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [ttsSupported]);

  const pauseSpeaking = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.pause();
  }, [ttsSupported]);

  const resumeSpeaking = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.resume();
  }, [ttsSupported]);

  const startListening = useCallback(() => {
    if (!sttSupported) return;
    if (recognitionRef.current) recognitionRef.current.abort();
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (e: any) => {
      const result = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(result);
      if (e.results[e.results.length - 1].isFinal) {
        onSpeechResult?.(result);
        setIsListening(false);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setTranscript("");
  }, [sttSupported, onSpeechResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    setIsListening(false);
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    config,
    updateConfig,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    startListening,
    stopListening,
    isSpeaking,
    isListening,
    transcript,
    ttsSupported,
    sttSupported,
  };
}
