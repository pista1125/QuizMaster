import { ReactNode } from 'react';
import { Triangle, Circle, Square, Star } from 'lucide-react';

interface AnswerButtonProps {
  answer: string;
  index: number;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  isCorrect?: boolean;
  showResult?: boolean;
}

const colorClasses = [
  'answer-red',
  'answer-blue',
  'answer-yellow',
  'answer-green',
];

const icons: ReactNode[] = [
  <Triangle className="w-6 h-6" key="triangle" />,
  <Circle className="w-6 h-6" key="circle" />,
  <Square className="w-6 h-6" key="square" />,
  <Star className="w-6 h-6" key="star" />,
];

export function AnswerButton({
  answer,
  index,
  onClick,
  disabled,
  selected,
  isCorrect,
  showResult,
}: AnswerButtonProps) {
  const getResultClass = () => {
    if (!showResult) return '';
    if (isCorrect) return 'ring-4 ring-success scale-105';
    if (selected && !isCorrect) return 'opacity-50 ring-4 ring-destructive';
    return 'opacity-40';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`answer-button ${colorClasses[index % 4]} ${getResultClass()} ${
        disabled ? 'cursor-not-allowed' : ''
      } flex items-center gap-4 w-full text-left`}
    >
      <span className="flex-shrink-0">{icons[index % 4]}</span>
      <span className="flex-1 text-lg md:text-xl">{answer}</span>
    </button>
  );
}
