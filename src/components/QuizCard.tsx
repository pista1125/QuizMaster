import { Clock, Zap, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuizCardProps {
  title: string;
  description: string;
  type: 'dynamic' | 'static';
  questionCount: number;
  timeLimit?: number;
  onClick: () => void;
  selected?: boolean;
}

export function QuizCard({
  title,
  description,
  type,
  questionCount,
  timeLimit,
  onClick,
  selected,
}: QuizCardProps) {
  return (
    <div
      onClick={onClick}
      className={`quiz-card cursor-pointer border-2 transition-all duration-300 ${
        selected
          ? 'border-primary ring-4 ring-primary/20'
          : 'border-transparent hover:border-primary/30'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <Badge
          variant={type === 'dynamic' ? 'default' : 'secondary'}
          className={`${
            type === 'dynamic'
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-accent text-accent-foreground'
          }`}
        >
          {type === 'dynamic' ? (
            <>
              <Zap className="w-3 h-3 mr-1" />
              Dinamikus
            </>
          ) : (
            <>
              <FileText className="w-3 h-3 mr-1" />
              Statikus
            </>
          )}
        </Badge>
      </div>

      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileText className="w-4 h-4" />
          {questionCount} kérdés
        </span>
        {timeLimit && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {timeLimit}mp/kérdés
          </span>
        )}
      </div>
    </div>
  );
}
