import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ArrowLeft, FolderOpen, ChevronRight, FileQuestion } from 'lucide-react';
import { SubjectCard } from '@/components/SubjectCard';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { useToast } from '@/hooks/use-toast';

interface Subfolder {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  question_count: number;
  subfolder_count: number;
}

interface FolderPageProps {
  folderId: string;
  folderName: string;
  onBack: () => void;
  onSubfolderClick: (folderId: string, folderName: string) => void;
  onViewQuestions: (folderId: string, folderName: string) => void;
}

const colorVariants = ['orange', 'blue', 'green', 'red', 'purple', 'teal', 'pink', 'indigo'] as const;

export const FolderPage = ({ 
  folderId, 
  folderName, 
  onBack, 
  onSubfolderClick,
  onViewQuestions 
}: FolderPageProps) => {
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [parentQuestionCount, setParentQuestionCount] = useState(0);
  const { toast } = useToast();

  const fetchSubfolders = async () => {
    try {
      // Fetch subfolders
      const { data: subfoldersData, error: subfoldersError } = await supabase
        .from('folders')
        .select(`
          id,
          name,
          description,
          created_at,
          questions(count)
        `)
        .eq('parent_id', folderId)
        .order('created_at', { ascending: false });

      if (subfoldersError) throw subfoldersError;

      // For each subfolder, count its subfolders
      const subfoldersWithCounts = await Promise.all(
        (subfoldersData || []).map(async (folder) => {
          const { count } = await supabase
            .from('folders')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', folder.id);

          return {
            ...folder,
            question_count: folder.questions?.[0]?.count || 0,
            subfolder_count: count || 0,
          };
        })
      );

      setSubfolders(subfoldersWithCounts);

      // Fetch question count for parent folder
      const { count: parentQCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('folder_id', folderId);

      setParentQuestionCount(parentQCount || 0);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar subpastas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubfolders();
  }, [folderId]);

  const handleEditFolder = (folder: Subfolder) => {
    setEditingFolder({
      id: folder.id,
      name: folder.name,
      description: folder.description,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDeleteFolder = async (subfolderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', subfolderId);

      if (error) throw error;

      setSubfolders(subfolders.filter(f => f.id !== subfolderId));
      toast({
        title: 'Subpasta excluída',
        description: 'A subpasta foi removida com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir subpasta',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setEditingFolder(null);
    }
  };

  const filteredSubfolders = subfolders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center h-14 sm:h-16">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="mr-3 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm">
              <button 
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Minhas Matérias
              </button>
              <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
              <span className="font-medium text-foreground">{folderName}</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg">
              <FolderOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">{folderName}</h2>
          </div>
          <p className="text-muted-foreground">Organize seus temas e questões dentro desta matéria</p>
        </div>

        {/* Quick Actions */}
        {parentQuestionCount > 0 && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => onViewQuestions(folderId, folderName)}
              className="gap-2"
            >
              <FileQuestion className="w-4 h-4" />
              Ver {parentQuestionCount} {parentQuestionCount === 1 ? 'questão' : 'questões'} desta matéria
            </Button>
          </div>
        )}

        {/* Top Actions */}
        <div className="flex flex-col gap-3 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 order-2 sm:order-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar temas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-card/80 backdrop-blur-sm border-border/50 focus:bg-card transition-all duration-300"
              />
            </div>
            <div className="flex gap-3 order-1 sm:order-2">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                size="lg"
                className="h-12 px-4 sm:px-6 bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none"
              >
                <Plus className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Novo Tema</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Subfolders Grid */}
        {filteredSubfolders.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-muted/50 to-accent/20 rounded-2xl p-8 max-w-md mx-auto">
              <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Nenhum tema encontrado' : 'Nenhum tema criado'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente alterar o termo de busca'
                  : 'Organize melhor seus estudos criando temas dentro desta matéria'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="gradient"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro tema
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredSubfolders.map((folder, index) => (
              <SubjectCard
                key={folder.id}
                id={folder.id}
                name={folder.name}
                description={folder.description || undefined}
                questionCount={folder.question_count}
                subfolderCount={folder.subfolder_count}
                createdAt={folder.created_at}
                colorVariant={colorVariants[index % colorVariants.length]}
                onClick={() => onSubfolderClick(folder.id, folder.name)}
                onEdit={() => handleEditFolder(folder)}
                onDelete={() => handleDeleteFolder(folder.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={isCreateDialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={fetchSubfolders}
        editFolder={editingFolder}
        parentId={folderId}
        parentName={folderName}
      />
    </div>
  );
};
