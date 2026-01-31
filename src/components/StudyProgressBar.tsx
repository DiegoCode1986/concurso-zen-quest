import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StudyProgressBarProps {
  completed: number;
  total: number;
  className?: string;
  showLabel?: boolean;
}

export const StudyProgressBar = ({ 
  completed, 
  total, 
  className,
  showLabel = true 
}: StudyProgressBarProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-foreground">
            {completed}/{total} ({percentage}%)
          </span>
        </div>
      )}
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
