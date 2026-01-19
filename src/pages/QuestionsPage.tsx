import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, Plus, MoreVertical, Pencil, Trash2, CheckCircle, XCircle, RotateCcw, FileDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateQuestionDialog } from '@/components/CreateQuestionDialog';
import { StudyTimer } from '@/components/StudyTimer';
import { exportQuestionsToPDF } from '@/utils/pdfExport';

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
  parentFolderName?: string;
}

export const QuestionsPage = ({ folderId, folderName, onBack, parentFolderName }: QuestionsPageProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{
    id: string;
    title: string;
    type: 'multiple_choice' | 'true_false';
    options: string[] | null;
    correct_answer: string | null;
    correct_boolean: boolean | null;
    explanation: string | null;
  } | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | boolean>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string | boolean>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, Set<string | boolean>>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5;
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

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion({
      ...question,
      type: question.type as 'multiple_choice' | 'true_false',
    });
    setIsCreateDialogOpen(true);
  };

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

  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setEditingQuestion(null);
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  const handleSelectAnswer = (questionId: string, answer: string | boolean) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleEliminateOption = (questionId: string, option: string | boolean) => {
    setEliminatedOptions(prev => {
      const newState = { ...prev };
      const currentEliminated = newState[questionId] || new Set();
      const newEliminated = new Set(currentEliminated);
      
      if (newEliminated.has(option)) {
        newEliminated.delete(option);
      } else {
        newEliminated.add(option);
      }
      
      newState[questionId] = newEliminated;
      return newState;
    });

    // Remove seleção se a opção eliminada estava selecionada
    setSelectedAnswers(prev => {
      if (prev[questionId] === option) {
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
      }
      return prev;
    });
  };

  const handleConfirmAnswer = (questionId: string) => {
    const selectedAnswer = selectedAnswers[questionId];
    if (selectedAnswer === undefined) return;

    setAnsweredQuestions(prev => ({ ...prev, [questionId]: selectedAnswer }));
    setShowResults(prev => ({ ...prev, [questionId]: true }));
  };

  const handleTryAgain = (questionId: string) => {
    setSelectedAnswers(prev => {
      const newState = { ...prev };
      delete newState[questionId];
      return newState;
    });
    setAnsweredQuestions(prev => {
      const newState = { ...prev };
      delete newState[questionId];
      return newState;
    });
    setShowResults(prev => {
      const newState = { ...prev };
      delete newState[questionId];
      return newState;
    });
    setEliminatedOptions(prev => {
      const newState = { ...prev };
      delete newState[questionId];
      return newState;
    });
  };

  const handleExportPDF = () => {
    if (questions.length === 0) {
      toast({
        title: 'Nenhuma questão para exportar',
        description: 'Crie algumas questões antes de exportar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      exportQuestionsToPDF(questions, folderName);
      toast({
        title: 'PDF gerado com sucesso!',
        description: `${questions.length} ${questions.length === 1 ? 'questão exportada' : 'questões exportadas'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar PDF',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-1 sm:gap-2 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Voltar</span>
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                  {parentFolderName && (
                    <>
                      <span>{parentFolderName}</span>
                      <span>/</span>
                    </>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{folderName}</h1>
                <p className="text-xs text-muted-foreground">
                  {questions.length} {questions.length === 1 ? 'questão' : 'questões'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Study Timer */}
        <div className="mb-4 sm:mb-6">
          <StudyTimer folderName={folderName} />
        </div>
        
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar questões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-border/50 focus:bg-white transition-all duration-300"
            />
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleExportPDF}
              variant="outline"
              size="lg"
              disabled={questions.length === 0}
              className="h-11 sm:h-12 px-4 sm:px-6"
            >
              <FileDown className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Exportar PDF</span>
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              variant="gradient"
              size="lg"
              className="h-11 sm:h-12 px-4 sm:px-6"
            >
              <Plus className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Nova Questão</span>
            </Button>
          </div>
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
          <>
            <div className="space-y-4">
              {currentQuestions.map((question) => (
              <Card key={question.id} className="shadow-card hover:shadow-card-hover transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-relaxed mb-2 whitespace-pre-wrap">
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
                        <DropdownMenuItem onClick={() => handleEditQuestion(question)}>
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
                      {question.options.map((option, index) => {
                        const isAnswered = answeredQuestions[question.id] !== undefined;
                        const isSelected = selectedAnswers[question.id] === option;
                        const isSelectedAnswered = answeredQuestions[question.id] === option;
                        const isCorrect = option === question.correct_answer;
                        const showAnswer = showResults[question.id];
                        const isEliminated = eliminatedOptions[question.id]?.has(option);
                        
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (!isAnswered && !isEliminated) {
                                  handleSelectAnswer(question.id, option);
                                }
                              }}
                              disabled={isAnswered || isEliminated}
                              className={`flex-1 p-3 rounded-lg border transition-all text-left ${
                                showAnswer && isCorrect
                                  ? 'bg-subject-green/10 border-subject-green text-subject-green'
                                  : showAnswer && isSelectedAnswered && !isCorrect
                                  ? 'bg-destructive/10 border-destructive text-destructive'
                                  : isSelected && !showAnswer
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : isEliminated
                                  ? 'bg-muted/30 border-border opacity-50'
                                  : 'bg-muted/50 border-border hover:bg-muted/70'
                              } ${!isAnswered && !isEliminated ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              <div className="flex items-center gap-2">
                                {showAnswer && isCorrect && (
                                  <CheckCircle className="w-4 h-4 text-subject-green" />
                                )}
                                {showAnswer && isSelectedAnswered && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                )}
                                <span className="font-medium text-sm">
                                  {String.fromCharCode(65 + index)})
                                </span>
                                <span className={`text-sm whitespace-pre-wrap ${isEliminated ? 'line-through' : ''}`}>{option}</span>
                              </div>
                            </button>
                            {!isAnswered && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEliminateOption(question.id, option)}
                                className="h-9 w-9 p-0 shrink-0"
                              >
                                <X className={`w-4 h-4 ${isEliminated ? 'text-primary' : 'text-muted-foreground'}`} />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                      
                      {selectedAnswers[question.id] !== undefined && !showResults[question.id] && (
                        <div className="mt-4 flex justify-center">
                          <Button
                            onClick={() => handleConfirmAnswer(question.id)}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Responder
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        {[true, false].map((value) => {
                          const isAnswered = answeredQuestions[question.id] !== undefined;
                          const isSelected = selectedAnswers[question.id] === value;
                          const isSelectedAnswered = answeredQuestions[question.id] === value;
                          const isCorrect = question.correct_boolean === value;
                          const showAnswer = showResults[question.id];
                          const isEliminated = eliminatedOptions[question.id]?.has(value);
                          
                          return (
                            <div key={value.toString()} className="flex items-center gap-2 flex-1">
                              <button
                                onClick={() => {
                                  if (!isAnswered && !isEliminated) {
                                    handleSelectAnswer(question.id, value);
                                  }
                                }}
                                disabled={isAnswered || isEliminated}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all flex-1 ${
                                  showAnswer && isCorrect
                                    ? 'bg-subject-green/10 border border-subject-green text-subject-green'
                                    : showAnswer && isSelectedAnswered && !isCorrect
                                    ? 'bg-destructive/10 border border-destructive text-destructive'
                                    : isSelected && !showAnswer
                                    ? 'bg-primary/10 border border-primary text-primary'
                                    : isEliminated
                                    ? 'bg-muted/30 border border-border opacity-50'
                                    : 'bg-muted/50 hover:bg-muted/70'
                                } ${!isAnswered && !isEliminated ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                {showAnswer && isCorrect && (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                {showAnswer && isSelectedAnswered && !isCorrect && (
                                  <XCircle className="w-4 h-4" />
                                )}
                                <span className={`text-sm font-medium ${isEliminated ? 'line-through' : ''}`}>
                                  {value ? 'Verdadeiro' : 'Falso'}
                                </span>
                              </button>
                              {!isAnswered && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEliminateOption(question.id, value)}
                                  className="h-9 w-9 p-0 shrink-0"
                                >
                                  <X className={`w-4 h-4 ${isEliminated ? 'text-primary' : 'text-muted-foreground'}`} />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {selectedAnswers[question.id] !== undefined && !showResults[question.id] && (
                        <div className="mt-4 flex justify-center">
                          <Button
                            onClick={() => handleConfirmAnswer(question.id)}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Responder
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {question.explanation && showResults[question.id] && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-medium text-foreground mb-2">Explicação:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.explanation}</p>
                    </div>
                  )}
                  
                  {showResults[question.id] && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTryAgain(question.id)}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Tentar novamente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Question Dialog */}
      <CreateQuestionDialog
        open={isCreateDialogOpen}
        onOpenChange={handleDialogClose}
        folderId={folderId}
        onSuccess={fetchQuestions}
        editQuestion={editingQuestion}
      />
    </div>
  );
};