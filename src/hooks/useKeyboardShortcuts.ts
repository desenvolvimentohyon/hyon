import { useEffect } from "react";

type ShortcutConfig = {
  [key: string]: () => void;
};

export function useKeyboardShortcuts(shortcuts: ShortcutConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar se o foco estiver em um input, textarea ou select
      const activeElement = document.activeElement;
      const isInput = 
        activeElement instanceof HTMLInputElement || 
        activeElement instanceof HTMLTextAreaElement || 
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      const key = event.key.toUpperCase();
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
