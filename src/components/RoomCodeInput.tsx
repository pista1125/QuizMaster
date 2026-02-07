import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';

interface RoomCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function RoomCodeInput({ value, onChange, error }: RoomCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState(false);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;

    const newValue = value.split('');
    newValue[index] = digit;
    const result = newValue.join('').slice(0, 6);
    onChange(result);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pastedData);
    
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2 md:gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-12 h-16 md:w-16 md:h-20 text-center text-2xl md:text-3xl font-bold rounded-xl border-2 transition-all duration-200 bg-card text-foreground
              ${
                error
                  ? 'border-destructive'
                  : focused
                  ? 'border-primary shadow-soft'
                  : 'border-border hover:border-primary/50'
              }
              focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20`}
          />
        ))}
      </div>
      {error && (
        <p className="text-center text-destructive text-sm font-medium">{error}</p>
      )}
    </div>
  );
}
