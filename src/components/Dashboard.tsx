import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, User, LogOut, BookOpen } from 'lucide-react';
import { SubjectCard } from './SubjectCard';
import { CreateFolderDialog } from './CreateFolderDialog';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Folder {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  question_count: number;
}

interface DashboardProps {
  user: any;
  onSignOut: () => void;
  onFolderClick: (folderId: string, folderName: string) => void;
}

const colorVariants = ['orange', 'blue', 'green', 'red', 'purple', 'teal', 'pink', 'indigo'] as const;

export const Dashboard = ({ user, onSignOut, onFolderClick }: DashboardProps) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          id,
          name,
          description,
          created_at,
          questions(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const foldersWithCount = data?.map(folder => ({
        ...folder,
        question_count: folder.questions?.[0]?.count || 0,
      })) || [];

      setFolders(foldersWithCount);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar matérias',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      setFolders(folders.filter(f => f.id !== folderId));
      toast({
        title: 'Matéria excluída',
        description: 'A matéria foi removida com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir matéria',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg shadow-card">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Questões Zen</h1>
                <p className="text-xs text-muted-foreground">Suas matérias de estudo</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={onSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar matérias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-border/50 focus:bg-white transition-all duration-300"
            />
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            variant="gradient"
            size="lg"
            className="h-12 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Matéria
          </Button>
        </div>

        {/* Folders Grid */}
        {filteredFolders.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-muted/50 to-accent/20 rounded-2xl p-8 max-w-md mx-auto">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Nenhuma matéria encontrada' : 'Nenhuma matéria criada'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente alterar o termo de busca'
                  : 'Comece criando sua primeira matéria de estudo'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="gradient"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira matéria
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFolders.map((folder, index) => (
              <SubjectCard
                key={folder.id}
                id={folder.id}
                name={folder.name}
                description={folder.description || undefined}
                questionCount={folder.question_count}
                createdAt={folder.created_at}
                colorVariant={colorVariants[index % colorVariants.length]}
                onClick={() => onFolderClick(folder.id, folder.name)}
                onEdit={() => {
                  // TODO: Implement edit functionality
                  toast({
                    title: 'Em desenvolvimento',
                    description: 'Funcionalidade de edição será implementada em breve.',
                  });
                }}
                onDelete={() => handleDeleteFolder(folder.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchFolders}
      />
    </div>
  );
};