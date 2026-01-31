import { useState } from 'react';
import { Circle, Play, CheckCircle2, RefreshCw, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type StudyStatus = 'not_started' | 'in_progress' | 'completed' | 'review';
export type StudyPriority = 'low' | 'medium' | 'high';

interface StudyTopicCardProps {
  id: string;
  name: string;
  status: StudyStatus;
  priority: StudyPriority;
  lastStudiedAt?: string | null;
  notes?: string | null;
  studySessions: number;
  onStatusChange: (id: string, status: StudyStatus) => void;
  onPriorityChange: (id: string, priority: StudyPriority) => void;
  onNotesChange: (id: string, notes: string) => void;
}

const statusConfig = {
  not_started: {
    icon: Circle,
    label: 'A iniciar',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  in_progress: {
    icon: Play,
    label: 'Estudando',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Concluído',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  review: {
    icon: RefreshCw,
    label: 'Revisão',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-slate-500' },
  medium: { label: 'Média', color: 'bg-yellow-500' },
  high: { label: 'Alta', color: 'bg-red-500' },
};

export const StudyTopicCard = ({
  id,
  name,
  status,
  priority,
  lastStudiedAt,
  notes,
  studySessions,
  onStatusChange,
  onPriorityChange,
  onNotesChange,
}: StudyTopicCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes || '');

  const StatusIcon = statusConfig[status].icon;
  const config = statusConfig[status];

  const formatLastStudied = () => {
    if (!lastStudiedAt) return null;
    return formatDistanceToNow(new Date(lastStudiedAt), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const handleNotesBlur = () => {
    if (localNotes !== notes) {
      onNotesChange(id, localNotes);
    }
  };

  const cycleStatus = () => {
    const statuses: StudyStatus[] = ['not_started', 'in_progress', 'completed', 'review'];
    const currentIndex = statuses.indexOf(status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    onStatusChange(id, statuses[nextIndex]);
  };

  const cyclePriority = () => {
    const priorities: StudyPriority[] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    onPriorityChange(id, priorities[nextIndex]);
  };

  return (
    <div className={cn(
      "border rounded-lg p-3 transition-all",
      config.bgColor,
      "hover:shadow-sm"
    )}>
      <div className="flex items-center gap-3">
        {/* Status Icon - Clickable */}
        <button
          onClick={cycleStatus}
          className={cn(
            "shrink-0 p-1 rounded-full transition-colors hover:bg-background/50",
            config.color
          )}
          title="Clique para alterar status"
        >
          <StatusIcon className="w-5 h-5" />
        </button>

        {/* Topic Name */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {lastStudiedAt && (
              <span>Última: {formatLastStudied()}</span>
            )}
            {studySessions > 0 && (
              <span>• {studySessions} sessões</span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className={cn("shrink-0 cursor-pointer", config.color)}
          onClick={cycleStatus}
        >
          {config.label}
        </Badge>

        {/* Priority Badge */}
        <Badge 
          className={cn(
            "shrink-0 cursor-pointer text-white",
            priorityConfig[priority].color
          )}
          onClick={cyclePriority}
        >
          {priorityConfig[priority].label}
        </Badge>

        {/* Notes Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {notes ? (
            <StickyNote className="w-4 h-4 text-yellow-600" />
          ) : isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Expandable Notes Section */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <Textarea
            placeholder="Adicione anotações sobre este tópico..."
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleNotesBlur}
            className="min-h-[80px] text-sm bg-background/50"
          />
        </div>
      )}
    </div>
  );
};
