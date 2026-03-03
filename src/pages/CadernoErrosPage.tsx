import { useState, useEffect } from 'react';
import { ArrowLeft, BookX, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WrongQuestion {
  id: string;
  question_id: string;
  folder_name: string;
  question: {
    id: string;
    title: string;
    type: string;
    options: string[] | null;
    correct_answer: string | null;
    correct_boolean: boolean | null;
    explanation: string | null;
  };
}

interface CadernoErrosPageProps {
  onBack: () => void;
}

export const CadernoErrosPage = ({ onBack }: CadernoErrosPageProps) => {
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWrongAnswers();
  }, []);

  const fetchWrongAnswers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wrong_answers')
        .select(`
          id,
          question_id,
          folder_name,
          question:questions(id, title, type, options, correct_answer, correct_boolean, explanation)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out any entries where the question was deleted
      const valid = (data || []).filter((d: any) => d.question) as unknown as WrongQuestion[];
      setWrongQuestions(valid);
    } catch (error) {
      console.error('Error fetching wrong answers:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o caderno de erros.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (answer: string | boolean) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleConfirm = async () => {
    if (selectedAnswer === null) return;

    const current = wrongQuestions[currentIndex];
    const q = current.question;

    let correct = false;
    if (q.type === 'multiple_choice') {
      correct = selectedAnswer === q.correct_answer;
    } else if (q.type === 'true_false') {
      correct = selectedAnswer === q.correct_boolean;
    }

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      // Remove from wrong_answers
      try {
        await supabase
          .from('wrong_answers')
          .delete()
          .eq('id', current.id);

        toast({
          title: '🎉 Acertou!',
          description: 'Questão removida do caderno de erros.',
        });
      } catch (error) {
        console.error('Error removing wrong answer:', error);
      }
    }
  };

  const handleNext = () => {
    if (isCorrect) {
      // Remove from local state
      const updated = wrongQuestions.filter((_, i) => i !== currentIndex);
      setWrongQuestions(updated);
      if (currentIndex >= updated.length) {
        setCurrentIndex(Math.max(0, updated.length - 1));
      }
    } else {
      setCurrentIndex((prev) => (prev + 1) % wrongQuestions.length);
    }
    setSelectedAnswer(null);
    setShowResult(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookX className="w-6 h-6 text-destructive" />
              Caderno de Erros
            </h1>
            <p className="text-sm text-muted-foreground">
              {wrongQuestions.length} {wrongQuestions.length === 1 ? 'questão' : 'questões'} para revisar
            </p>
          </div>
        </div>

        {wrongQuestions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <Sparkles className="w-16 h-16 text-primary mx-auto" />
                <h3 className="text-xl font-semibold text-foreground">Parabéns!</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Seu caderno de erros está vazio. Continue fazendo simulados para adicionar questões aqui.
                </p>
                <Button onClick={onBack} variant="outline">Voltar</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Questão {currentIndex + 1} de {wrongQuestions.length}</span>
              <Badge variant="secondary">{wrongQuestions[currentIndex].folder_name}</Badge>
            </div>

            {/* Question Card */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap">
                  {wrongQuestions[currentIndex].question.title}
                </p>

                <div className="space-y-3">
                  {wrongQuestions[currentIndex].question.type === 'multiple_choice' &&
                    wrongQuestions[currentIndex].question.options?.map((option, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isSelected = selectedAnswer === option;
                      const isCorrectOption = option === wrongQuestions[currentIndex].question.correct_answer;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(option)}
                          disabled={showResult}
                          className={cn(
                            "w-full p-4 rounded-lg border text-left transition-all",
                            !showResult && isSelected && "border-primary bg-primary/10 ring-2 ring-primary",
                            !showResult && !isSelected && "border-border hover:border-primary/50 hover:bg-accent/50",
                            showResult && isCorrectOption && "border-green-500 bg-green-50 dark:bg-green-950/30",
                            showResult && isSelected && !isCorrectOption && "border-red-500 bg-red-50 dark:bg-red-950/30",
                            showResult && !isSelected && !isCorrectOption && "border-border opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{letter})</span>
                            <span className="whitespace-pre-wrap flex-1">{option}</span>
                            {showResult && isCorrectOption && <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
                            {showResult && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}

                  {wrongQuestions[currentIndex].question.type === 'true_false' &&
                    [true, false].map((value) => {
                      const isSelected = selectedAnswer === value;
                      const isCorrectOption = value === wrongQuestions[currentIndex].question.correct_boolean;
                      const label = value ? 'Verdadeiro' : 'Falso';

                      return (
                        <button
                          key={String(value)}
                          onClick={() => handleSelectAnswer(value)}
                          disabled={showResult}
                          className={cn(
                            "w-full p-4 rounded-lg border text-left transition-all",
                            !showResult && isSelected && "border-primary bg-primary/10 ring-2 ring-primary",
                            !showResult && !isSelected && "border-border hover:border-primary/50 hover:bg-accent/50",
                            showResult && isCorrectOption && "border-green-500 bg-green-50 dark:bg-green-950/30",
                            showResult && isSelected && !isCorrectOption && "border-red-500 bg-red-50 dark:bg-red-950/30",
                            showResult && !isSelected && !isCorrectOption && "border-border opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium flex-1">{label}</span>
                            {showResult && isCorrectOption && <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
                            {showResult && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Explanation after result */}
                {showResult && wrongQuestions[currentIndex].question.explanation && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-1">Explicação:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {wrongQuestions[currentIndex].question.explanation}
                    </p>
                  </div>
                )}

                {/* Result feedback */}
                {showResult && (
                  <div className={cn(
                    "p-4 rounded-lg text-center font-medium",
                    isCorrect
                      ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  )}>
                    {isCorrect
                      ? "✅ Correto! Questão removida do caderno."
                      : "❌ Errado! A questão permanece no caderno."}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {!showResult ? (
                <Button onClick={handleConfirm} disabled={selectedAnswer === null}>
                  Confirmar Resposta
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {wrongQuestions.length <= 1 && isCorrect ? 'Finalizar' : 'Próxima'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
