import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { SimuladoResult, SimuladoQuestion } from './SimuladoPage';

interface SimuladoResultPageProps {
  result: SimuladoResult;
  onNewSimulado: () => void;
  onBack: () => void;
}

export const SimuladoResultPage = ({ result, onNewSimulado, onBack }: SimuladoResultPageProps) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const bySubject: Record<string, { correct: number; total: number }> = {};

    result.questions.forEach(question => {
      const userAnswer = result.answers[question.id];
      
      // Initialize subject stats
      if (!bySubject[question.folderName]) {
        bySubject[question.folderName] = { correct: 0, total: 0 };
      }
      bySubject[question.folderName].total++;

      if (userAnswer === undefined) {
        unanswered++;
        return;
      }

      let isCorrect = false;
      if (question.type === 'multiple_choice') {
        isCorrect = userAnswer === question.correct_answer;
      } else if (question.type === 'true_false') {
        isCorrect = userAnswer === question.correct_boolean;
      }

      if (isCorrect) {
        correct++;
        bySubject[question.folderName].correct++;
      } else {
        incorrect++;
      }
    });

    const total = result.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timeSpent = Math.floor((result.endTime.getTime() - result.startTime.getTime()) / 1000);

    return { correct, incorrect, unanswered, total, percentage, timeSpent, bySubject };
  }, [result]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} min ${secs}s`;
    }
    return `${secs}s`;
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getQuestionResult = (question: SimuladoQuestion) => {
    const userAnswer = result.answers[question.id];
    if (userAnswer === undefined) return 'unanswered';
    
    if (question.type === 'multiple_choice') {
      return userAnswer === question.correct_answer ? 'correct' : 'incorrect';
    } else {
      return userAnswer === question.correct_boolean ? 'correct' : 'incorrect';
    }
  };

  const getPerformanceMessage = () => {
    if (stats.percentage >= 90) return { text: 'Excelente!', emoji: '🏆' };
    if (stats.percentage >= 70) return { text: 'Muito bom!', emoji: '🎯' };
    if (stats.percentage >= 50) return { text: 'Bom trabalho!', emoji: '👍' };
    return { text: 'Continue estudando!', emoji: '📚' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resultado do Simulado</h1>
          <p className="text-muted-foreground">Revise suas respostas</p>
        </div>
      </div>

      {/* Score Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-6xl">{performance.emoji}</div>
            <div>
              <p className="text-2xl font-bold text-foreground">{performance.text}</p>
              <p className="text-4xl font-bold text-primary mt-2">
                {stats.correct}/{stats.total}
              </p>
              <p className="text-xl text-muted-foreground">({stats.percentage}%)</p>
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{stats.correct} corretas</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" />
                <span>{stats.incorrect} erradas</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatTime(stats.timeSpent)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats by Subject */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Desempenho por Matéria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.bySubject).map(([subject, data]) => {
            const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            return (
              <div key={subject} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{subject}</span>
                  <span className="text-muted-foreground">
                    {data.correct}/{data.total} ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Questions Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revisão das Questões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.questions.map((question, idx) => {
            const questionResult = getQuestionResult(question);
            const isExpanded = expandedQuestions.has(question.id);
            const userAnswer = result.answers[question.id];

            return (
              <Collapsible
                key={question.id}
                open={isExpanded}
                onOpenChange={() => toggleQuestion(question.id)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all hover:bg-accent/50",
                      questionResult === 'correct' && "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30",
                      questionResult === 'incorrect' && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
                      questionResult === 'unanswered' && "border-border bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {questionResult === 'correct' && (
                          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        )}
                        {questionResult === 'incorrect' && (
                          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                        )}
                        {questionResult === 'unanswered' && (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground shrink-0" />
                        )}
                        <div>
                          <span className="font-medium text-sm text-muted-foreground mr-2">
                            {idx + 1}.
                          </span>
                          <span className="font-medium line-clamp-1">
                            {question.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {question.folderName}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 py-3 border border-t-0 rounded-b-lg bg-background space-y-3">
                    <p className="text-foreground whitespace-pre-wrap">{question.title}</p>

                    {question.type === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isUserAnswer = userAnswer === option;
                          const isCorrectAnswer = question.correct_answer === option;

                          return (
                            <div
                              key={optIdx}
                              className={cn(
                                "p-3 rounded-lg border",
                                isCorrectAnswer && "border-green-500 bg-green-50 dark:bg-green-950/30",
                                isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-50 dark:bg-red-950/30",
                                !isUserAnswer && !isCorrectAnswer && "border-border"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{letter})</span>
                                <span>{option}</span>
                                {isCorrectAnswer && (
                                  <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.type === 'true_false' && (
                      <div className="space-y-2">
                        {[true, false].map((value) => {
                          const isUserAnswer = userAnswer === value;
                          const isCorrectAnswer = question.correct_boolean === value;
                          const label = value ? 'Verdadeiro' : 'Falso';

                          return (
                            <div
                              key={String(value)}
                              className={cn(
                                "p-3 rounded-lg border",
                                isCorrectAnswer && "border-green-500 bg-green-50 dark:bg-green-950/30",
                                isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-50 dark:bg-red-950/30",
                                !isUserAnswer && !isCorrectAnswer && "border-border"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span>{label}</span>
                                {isCorrectAnswer && (
                                  <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.explanation && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm font-medium mb-1">Explicação:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Voltar ao Início
        </Button>
        <Button onClick={onNewSimulado} className="flex-1">
          Novo Simulado
        </Button>
      </div>
    </div>
  );
};
