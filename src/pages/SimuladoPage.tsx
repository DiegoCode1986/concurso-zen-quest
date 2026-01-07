import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SelectedSubject {
  folderId: string;
  folderName: string;
  questionCount: number;
  availableCount: number;
}

export interface SimuladoQuestion {
  id: string;
  title: string;
  type: string;
  options: string[] | null;
  correct_answer: string | null;
  correct_boolean: boolean | null;
  explanation: string | null;
  folderName: string;
}

export interface SimuladoResult {
  questions: SimuladoQuestion[];
  answers: Record<string, string | boolean>;
  startTime: Date;
  endTime: Date;
}

interface SimuladoPageProps {
  subjects: SelectedSubject[];
  onFinish: (result: SimuladoResult) => void;
  onCancel: () => void;
}

export const SimuladoPage = ({ subjects, onFinish, onCancel }: SimuladoPageProps) => {
  const [questions, setQuestions] = useState<SimuladoQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [subjects]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const fetchQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allQuestions: SimuladoQuestion[] = [];

      for (const subject of subjects) {
        const { data, error } = await supabase
          .from('questions')
          .select('id, title, type, options, correct_answer, correct_boolean, explanation')
          .eq('user_id', user.id)
          .eq('folder_id', subject.folderId);

        if (error) throw error;

        if (data) {
          // Shuffle and pick the requested number
          const shuffled = data.sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, subject.questionCount);
          
          allQuestions.push(...selected.map(q => ({
            ...q,
            folderName: subject.folderName
          })));
        }
      }

      // Shuffle all questions together
      const shuffledAll = allQuestions.sort(() => Math.random() - 0.5);
      setQuestions(shuffledAll);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as questões.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (answer: string | boolean) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleFinish = () => {
    onFinish({
      questions,
      answers,
      startTime,
      endTime: new Date()
    });
  };

  const questionNavStatus = useMemo(() => {
    return questions.map((q, idx) => ({
      index: idx,
      answered: answers[q.id] !== undefined,
      current: idx === currentIndex
    }));
  }, [questions, answers, currentIndex]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma questão encontrada.</p>
        <Button onClick={onCancel} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar simulado?</AlertDialogTitle>
                <AlertDialogDescription>
                  Seu progresso será perdido. Tem certeza que deseja sair?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continuar simulado</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel}>Sair</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Questão {currentIndex + 1} de {questions.length}
            </h1>
            <p className="text-sm text-muted-foreground">
              {answeredCount} respondidas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2">
        {questionNavStatus.map(({ index, answered, current }) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-8 h-8 rounded text-sm font-medium transition-colors",
              current && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              answered
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <Badge variant="secondary">{currentQuestion.folderName}</Badge>
          
          <p className="text-lg font-medium leading-relaxed">
            {currentQuestion.title}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              currentQuestion.options.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = answers[currentQuestion.id] === option;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(option)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    )}
                  >
                    <span className="font-medium mr-2">{letter})</span>
                    {option}
                  </button>
                );
              })
            )}

            {currentQuestion.type === 'true_false' && (
              <>
                <button
                  onClick={() => handleSelectAnswer(true)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all",
                    answers[currentQuestion.id] === true
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                >
                  <span className="font-medium">Verdadeiro</span>
                </button>
                <button
                  onClick={() => handleSelectAnswer(false)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all",
                    answers[currentQuestion.id] === false
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                >
                  <span className="font-medium">Falso</span>
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {currentIndex === questions.length - 1 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>
                  Finalizar Simulado
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Finalizar simulado?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {answeredCount < questions.length ? (
                      <span className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        Você deixou {questions.length - answeredCount} questões sem resposta.
                      </span>
                    ) : (
                      'Você respondeu todas as questões. Deseja finalizar?'
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Revisar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFinish}>Finalizar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            >
              Próxima
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
