import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number;
  onValueChange: (value: number) => void;
}

function formatCents(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const reais = Math.floor(absCents / 100);
  const centavos = absCents % 100;
  const formatted = reais.toLocaleString("pt-BR") + "," + String(centavos).padStart(2, "0");
  return isNegative ? `-${formatted}` : formatted;
}

function parsePastedValue(text: string): number {
  // Remove R$, spaces, dots (thousand sep), then treat comma as decimal
  let cleaned = text.replace(/[Rr$\s]/g, "").trim();
  // If has comma and dot, determine which is decimal
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma > lastDot) {
    // Comma is decimal: 1.234,56
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // Dot is decimal: 1,234.56
    cleaned = cleaned.replace(/,/g, "");
  } else {
    // No decimal or only one separator
    cleaned = cleaned.replace(/,/g, ".");
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, onFocus, onBlur, ...props }, ref) => {
    const centsFromValue = Math.round((value || 0) * 100);
    const [displayValue, setDisplayValue] = React.useState(() => formatCents(centsFromValue));
    const centsRef = React.useRef(centsFromValue);

    // Sync external value changes
    React.useEffect(() => {
      const newCents = Math.round((value || 0) * 100);
      if (newCents !== centsRef.current) {
        centsRef.current = newCents;
        setDisplayValue(formatCents(newCents));
      }
    }, [value]);

    const updateValue = (newCents: number) => {
      centsRef.current = newCents;
      setDisplayValue(formatCents(newCents));
      onValueChange(newCents / 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = e;

      if (key === "Backspace") {
        e.preventDefault();
        const newCents = Math.floor(centsRef.current / 10);
        updateValue(newCents);
        return;
      }

      if (key === "Delete") {
        e.preventDefault();
        updateValue(0);
        return;
      }

      if (key >= "0" && key <= "9") {
        e.preventDefault();
        const digit = parseInt(key);
        const newCents = centsRef.current * 10 + digit;
        // Cap at 999999999 (9,999,999.99)
        if (newCents <= 999999999) {
          updateValue(newCents);
        }
        return;
      }

      // Allow Tab, Enter, Escape, arrow keys, etc.
      const allowedKeys = ["Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight", "Home", "End"];
      if (!allowedKeys.includes(key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text");
      const cents = parsePastedValue(text);
      updateValue(cents);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all on focus for easy replacement
      setTimeout(() => e.target.select(), 0);
      onFocus?.(e);
    };

    const handleBlurInternal = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-150",
          className,
        )}
        value={displayValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlurInternal}
        onChange={() => {}} // controlled, changes via keyDown/paste
        {...props}
      />
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
