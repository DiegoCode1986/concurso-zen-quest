import { Folder, Clock, BookOpen, Shuffle, BarChart3, ClipboardList, Target, BookX, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRevisionsDue } from '@/hooks/useRevisionsDue';
import { ThemeToggle } from '@/components/ThemeToggle';

type ViewId = 'dashboard' | 'random-study' | 'flashcards' | 'timeclock' | 'statistics' | 'simulado-config' | 'study-plan' | 'caderno-erros' | 'revisions';

interface SidebarProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
}

export const Sidebar = ({ currentView, onNavigate }: SidebarProps) => {
  const { total: revisionsDue } = useRevisionsDue();

  const navItems = [
    { id: 'dashboard' as const, label: 'Minhas Matérias', icon: Folder },
    { id: 'study-plan' as const, label: 'Plano de Estudos', icon: Target },
    { id: 'revisions' as const, label: 'Revisões', icon: CalendarClock, badge: revisionsDue },
    { id: 'random-study' as const, label: 'Estudo Aleatório', icon: Shuffle },
    { id: 'flashcards' as const, label: 'Flash Cards', icon: BookOpen },
    { id: 'simulado-config' as const, label: 'Simulado', icon: ClipboardList },
    { id: 'caderno-erros' as const, label: 'Caderno de Erros', icon: BookX },
    { id: 'timeclock' as const, label: 'Bater Ponto', icon: Clock },
    { id: 'statistics' as const, label: 'Estatísticas', icon: BarChart3 },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">Questões</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Navegação
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const badge = (item as any).badge as number | undefined;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {badge && badge > 0 && (
                  <span className={cn(
                    "text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.25rem] text-center",
                    isActive ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground"
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <ThemeToggle variant="full" />
      </div>
    </aside>
  );
};
