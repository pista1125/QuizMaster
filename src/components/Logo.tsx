import { Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  const iconSizes = {
    sm: 18,
    md: 28,
    lg: 44,
  };

  return (
    <div className="flex items-center gap-2">
      <div className="hero-gradient p-2 rounded-xl">
        <Sparkles className="text-primary-foreground" size={iconSizes[size]} />
      </div>
      <span className={`font-fredoka ${sizeClasses[size]} bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent`}>
        QuizMaster
      </span>
    </div>
  );
}
