import { useEffect, useState } from 'react';

interface TimerProps {
  seconds: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export function Timer({ seconds, onTimeUp, isActive }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, isActive]);

  const percentage = (timeLeft / seconds) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage > 50) return 'hsl(var(--success))';
    if (percentage > 25) return 'hsl(var(--accent))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="45"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
        />
        <circle
          cx="48"
          cy="48"
          r="45"
          fill="none"
          stroke={getColor()}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-2xl font-bold ${
            percentage <= 25 ? 'text-destructive animate-pulse' : 'text-foreground'
          }`}
        >
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
