import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Shuffle, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Question {
  id: string;
  title: string;
  type: string;
  options?: string[];
  correct_answer?: string;
  correct_boolean?: boolean;
  explanation?: string;
  folder_name?: string;
}

export const RandomStudyPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllQuestions();
  }, []);

  const fetchAllQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          title,
          type,
          options,
          correct_answer,
          correct_boolean,
          explanation,
          folder_id,
          folders!inner(name)
        `);

      if (error) throw error;

      const questionsWithFolder = data?.map(q => ({
        ...q,
        folder_name: (q.folders as any)?.name || 'Sem pasta',
      })) || [];

      // Embaralhar questões
      const shuffled = [...questionsWithFolder].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
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

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSelectedAnswer(null);
    toast({
      title: 'Questões embaralhadas!',
      description: 'A ordem das questões foi alterada.',
    });
  };

  const handleTryAgain = () => {
    setShowAnswer(false);
    setSelectedAnswer(null);
  };

  const handleSelect = (value: string) => {
    if (showAnswer) return; // avoid changing after reveal
    setSelectedAnswer(value);
    setShowAnswer(true); // reveal immediately after click
  };

  const isCorrect = () => {
    const current = questions[currentIndex];
    if (current.type === 'true_false') {
      return selectedAnswer === String(current.correct_boolean);
    }
    return selectedAnswer === current.correct_answer;
  };

  const isOptionCorrect = (option: string) => {
    const current = questions[currentIndex];
    if (current.type === 'true_false') return option === String(current.correct_boolean);
    return option === current.correct_answer;
  };

  const getCorrectAnswerDisplay = () => {
    const current = questions[currentIndex];
    if (current.type === 'true_false') {
      return current.correct_boolean ? 'Verdadeiro' : 'Falso';
    }
    return current.correct_answer;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando questões...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="p-8 max-w-md text-center">
          <Shuffle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma questão disponível</h3>
          <p className="text-muted-foreground">
            Adicione questões às suas matérias para começar a estudar.
          </p>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estudo Aleatório</h1>
            <p className="text-muted-foreground">
              Questão {currentIndex + 1} de {questions.length}
            </p>
          </div>
          <Button onClick={handleShuffle} variant="outline" size="sm">
            <Shuffle className="w-4 h-4 mr-2" />
            Embaralhar
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">{currentQuestion.folder_name}</Badge>
          <Badge variant="outline">{currentQuestion.type === 'true_false' ? 'V/F' : 'Múltipla Escolha'}</Badge>
        </div>

        <h2 className="text-xl font-semibold mb-6">{currentQuestion.title}</h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.type === 'true_false' ? (
            <>
              <Button
                onClick={() => handleSelect('true')}
                variant="outline"
                className={`w-full justify-start text-left h-auto py-4 ${
                  showAnswer
                    ? (isOptionCorrect('true')
                        ? 'border-2 border-green-200 bg-green-50'
                        : selectedAnswer === 'true'
                          ? 'border-2 border-red-200 bg-red-50'
                          : '')
                    : (selectedAnswer === 'true' ? 'ring-2 ring-primary' : '')
                }`}
                disabled={showAnswer}
              >
                <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" />
                Verdadeiro
                {showAnswer && (
                  isOptionCorrect('true') ? (
                    <CheckCircle2 className="w-5 h-5 ml-auto text-green-600" />
                  ) : selectedAnswer === 'true' ? (
                    <XCircle className="w-5 h-5 ml-auto text-red-600" />
                  ) : null
                )}
              </Button>
              <Button
                onClick={() => handleSelect('false')}
                variant="outline"
                className={`w-full justify-start text-left h-auto py-4 ${
                  showAnswer
                    ? (isOptionCorrect('false')
                        ? 'border-2 border-green-200 bg-green-50'
                        : selectedAnswer === 'false'
                          ? 'border-2 border-red-200 bg-red-50'
                          : '')
                    : (selectedAnswer === 'false' ? 'ring-2 ring-primary' : '')
                }`}
                disabled={showAnswer}
              >
                <XCircle className="w-5 h-5 mr-3 shrink-0" />
                Falso
                {showAnswer && (
                  isOptionCorrect('false') ? (
                    <CheckCircle2 className="w-5 h-5 ml-auto text-green-600" />
                  ) : selectedAnswer === 'false' ? (
                    <XCircle className="w-5 h-5 ml-auto text-red-600" />
                  ) : null
                )}
              </Button>
            </>
          ) : (
            currentQuestion.options?.map((option, idx) => (
              <Button
                key={idx}
                onClick={() => handleSelect(option)}
                variant="outline"
                className={`w-full justify-start text-left h-auto py-4 ${
                  showAnswer
                    ? (isOptionCorrect(option)
                        ? 'border-2 border-green-200 bg-green-50'
                        : selectedAnswer === option
                          ? 'border-2 border-red-200 bg-red-50'
                          : '')
                    : (selectedAnswer === option ? 'ring-2 ring-primary' : '')
                }`}
                disabled={showAnswer}
              >
                <span className="font-semibold mr-3">{String.fromCharCode(65 + idx)}.</span>
                {option}
                {showAnswer && (
                  isOptionCorrect(option) ? (
                    <CheckCircle2 className="w-5 h-5 ml-auto text-green-600" />
                  ) : selectedAnswer === option ? (
                    <XCircle className="w-5 h-5 ml-auto text-red-600" />
                  ) : null
                )}
              </Button>
            ))
          )}
        </div>


        {/* Answer Feedback */}
        {showAnswer && (
          <div className={`p-6 rounded-lg mb-6 ${isCorrect() ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <div className="flex items-start gap-3 mb-4">
              {isCorrect() ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold text-lg mb-2 ${isCorrect() ? 'text-green-900' : 'text-red-900'}`}>
                  {isCorrect() ? 'Resposta Correta! 🎉' : 'Resposta Incorreta'}
                </p>
                {!isCorrect() && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-red-800 mb-1">Resposta correta:</p>
                    <p className="text-base font-semibold text-red-900 bg-white/50 px-3 py-2 rounded">
                      {getCorrectAnswerDisplay()}
                    </p>
                  </div>
                )}
                {currentQuestion.explanation && (
                  <div className={`mt-3 ${isCorrect() ? 'text-green-800' : 'text-red-800'}`}>
                    <p className="font-medium mb-1">Explicação:</p>
                    <p className="text-sm bg-white/50 px-3 py-2 rounded">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={handleTryAgain} 
              variant="outline" 
              className="w-full mt-2"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-auto">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="flex-1"
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
