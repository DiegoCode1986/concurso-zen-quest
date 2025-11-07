import { Folder, Shuffle, BookOpen, Menu, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MobileNavProps {
  currentView: 'dashboard' | 'random-study' | 'flashcards' | 'timeclock';
  onNavigate: (view: 'dashboard' | 'random-study' | 'flashcards' | 'timeclock') => void;
}

export const MobileNav = ({ currentView, onNavigate }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);

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

  const handleNavigate = (view: 'dashboard' | 'random-study' | 'flashcards' | 'timeclock') => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Questões</span>
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
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};
