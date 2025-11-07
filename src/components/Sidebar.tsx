import { Folder, Clock, BookOpen, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentView: 'dashboard' | 'random-study' | 'flashcards' | 'timeclock';
  onNavigate: (view: 'dashboard' | 'random-study' | 'flashcards' | 'timeclock') => void;
}

export const Sidebar = ({ currentView, onNavigate }: SidebarProps) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Minhas Matérias',
      icon: Folder,
    },
    {
      id: 'random-study' as const,
      label: 'Estudo Aleatório',
      icon: Shuffle,
    },
    {
      id: 'flashcards' as const,
      label: 'Flash Cards',
      icon: BookOpen,
    },
    {
      id: 'timeclock' as const,
      label: 'Bater Ponto',
      icon: Clock,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">Questões</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Navegação
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
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
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
