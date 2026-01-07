import { useState, useEffect } from 'react';
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FolderWithCount {
  id: string;
  name: string;
  questionCount: number;
}

interface SelectedSubject {
  folderId: string;
  folderName: string;
  questionCount: number;
  availableCount: number;
}

interface SimuladoConfigPageProps {
  onBack: () => void;
  onStartSimulado: (subjects: SelectedSubject[]) => void;
}

export const SimuladoConfigPage = ({ onBack, onStartSimulado }: SimuladoConfigPageProps) => {
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFoldersWithQuestionCounts();
  }, []);

  const fetchFoldersWithQuestionCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', user.id);

      if (foldersError) throw foldersError;

      // Fetch question counts per folder
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('folder_id')
        .eq('user_id', user.id);

      if (questionsError) throw questionsError;

      // Count questions per folder
      const questionCounts: Record<string, number> = {};
      questionsData?.forEach(q => {
        questionCounts[q.folder_id] = (questionCounts[q.folder_id] || 0) + 1;
      });

      // Combine data - only show folders with questions
      const foldersWithCounts = foldersData
        ?.map(folder => ({
          id: folder.id,
          name: folder.name,
          questionCount: questionCounts[folder.id] || 0
        }))
        .filter(folder => folder.questionCount > 0) || [];

      setFolders(foldersWithCounts);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as matérias.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFolder = (folderId: string, folderQuestionCount: number) => {
    setSelectedSubjects(prev => {
      if (prev[folderId] !== undefined) {
        const { [folderId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [folderId]: Math.min(5, folderQuestionCount) };
    });
  };

  const handleQuestionCountChange = (folderId: string, count: number, max: number) => {
    if (count < 1) count = 1;
    if (count > max) count = max;
    setSelectedSubjects(prev => ({ ...prev, [folderId]: count }));
  };

  const totalQuestions = Object.values(selectedSubjects).reduce((sum, count) => sum + count, 0);

  const handleStartSimulado = () => {
    if (totalQuestions === 0) {
      toast({
        title: 'Selecione questões',
        description: 'Você precisa selecionar pelo menos uma matéria com questões.',
        variant: 'destructive'
      });
      return;
    }

    const subjects: SelectedSubject[] = Object.entries(selectedSubjects).map(([folderId, count]) => {
      const folder = folders.find(f => f.id === folderId)!;
      return {
        folderId,
        folderName: folder.name,
        questionCount: count,
        availableCount: folder.questionCount
      };
    });

    onStartSimulado(subjects);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerar Simulado</h1>
          <p className="text-muted-foreground">Selecione as matérias e quantidade de questões</p>
        </div>
      </div>

      {folders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma questão disponível</h3>
            <p className="text-muted-foreground">
              Adicione questões às suas matérias para poder gerar simulados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione as matérias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {folders.map(folder => {
              const isSelected = selectedSubjects[folder.id] !== undefined;
              const selectedCount = selectedSubjects[folder.id] || 0;

              return (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={folder.id}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleFolder(folder.id, folder.questionCount)}
                    />
                    <label
                      htmlFor={folder.id}
                      className="font-medium cursor-pointer"
                    >
                      {folder.name}
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <Input
                        type="number"
                        min={1}
                        max={folder.questionCount}
                        value={selectedCount}
                        onChange={(e) => handleQuestionCountChange(
                          folder.id,
                          parseInt(e.target.value) || 1,
                          folder.questionCount
                        )}
                        className="w-20 text-center"
                      />
                    )}
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      de {folder.questionCount} disponíveis
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Total de questões:</span>
                <span className="text-xl font-bold text-primary">{totalQuestions}</span>
              </div>

              <Button
                onClick={handleStartSimulado}
                disabled={totalQuestions === 0}
                className="w-full"
                size="lg"
              >
                <ClipboardList className="w-5 h-5 mr-2" />
                Iniciar Simulado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
