import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, Plus, MoreVertical, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateQuestionDialog } from '@/components/CreateQuestionDialog';

interface Question {
  id: string;
  title: string;
  type: string;
  options: string[] | null;
  correct_answer: string | null;
  correct_boolean: boolean | null;
  explanation: string | null;
  created_at: string;
}

interface QuestionsPageProps {
  folderId: string;
  folderName: string;
  onBack: () => void;
}

export const QuestionsPage = ({ folderId, folderName, onBack }: QuestionsPageProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar questões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [folderId]);

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(questions.filter(q => q.id !== questionId));
      toast({
        title: 'Questão excluída',
        description: 'A questão foi removida com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir questão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando questões...</p>
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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">{folderName}</h1>
                <p className="text-xs text-muted-foreground">
                  {questions.length} {questions.length === 1 ? 'questão' : 'questões'}
                </p>
              </div>
            </div>
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
              placeholder="Buscar questões..."
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
            Nova Questão
          </Button>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-muted/50 to-accent/20 rounded-2xl p-8 max-w-md mx-auto">
              <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Nenhuma questão encontrada' : 'Nenhuma questão criada'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente alterar o termo de busca'
                  : 'Comece criando sua primeira questão'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="gradient"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira questão
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <Card key={question.id} className="shadow-card hover:shadow-card-hover transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-relaxed mb-2">
                        {question.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge 
                          variant={question.type === 'multiple_choice' ? 'default' : 'secondary'}
                          className="font-medium"
                        >
                          {question.type === 'multiple_choice' ? 'Múltipla escolha' : 'Verdadeiro/Falso'}
                        </Badge>
                        <span>•</span>
                        <span>{formatDate(question.created_at)}</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => {
                          toast({
                            title: 'Em desenvolvimento',
                            description: 'Funcionalidade de edição será implementada em breve.',
                          });
                        }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {question.type === 'multiple_choice' && question.options ? (
                    <div className="space-y-2">
                      {question.options.map((option, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border transition-colors ${
                            option === question.correct_answer
                              ? 'bg-subject-green/10 border-subject-green text-subject-green'
                              : 'bg-muted/50 border-border'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {option === question.correct_answer && (
                              <CheckCircle className="w-4 h-4 text-subject-green" />
                            )}
                            <span className="font-medium text-sm">
                              {String.fromCharCode(65 + index)})
                            </span>
                            <span className="text-sm">{option}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        question.correct_boolean === true
                          ? 'bg-subject-green/10 border border-subject-green text-subject-green'
                          : 'bg-muted/50'
                      }`}>
                        {question.correct_boolean === true && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">Verdadeiro</span>
                      </div>
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        question.correct_boolean === false
                          ? 'bg-subject-green/10 border border-subject-green text-subject-green'
                          : 'bg-muted/50'
                      }`}>
                        {question.correct_boolean === false && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">Falso</span>
                      </div>
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-medium text-foreground mb-2">Explicação:</h4>
                      <p className="text-sm text-muted-foreground">{question.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Question Dialog */}
      <CreateQuestionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        folderId={folderId}
        onSuccess={fetchQuestions}
      />
    </div>
  );
};