import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Sparkles, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StudyTopicCard, type StudyStatus, type StudyPriority } from '@/components/StudyTopicCard';
import { StudyProgressBar } from '@/components/StudyProgressBar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SubjectWithTopics, FolderWithProgress, StudyProgress } from '@/types/studyProgress';

interface StudyPlanPageProps {
  onBack: () => void;
}

type FilterStatus = 'all' | StudyStatus;
type FilterPriority = 'all' | StudyPriority;

export const StudyPlanPage = ({ onBack }: StudyPlanPageProps) => {
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all folders
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (foldersError) throw foldersError;

      // Fetch all study progress
      const { data: progressData, error: progressError } = await supabase
        .from('study_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Create a map of folder_id to progress
      const progressMap = new Map<string, StudyProgress>();
      progressData?.forEach(p => {
        progressMap.set(p.folder_id, p as StudyProgress);
      });

      // Separate main subjects (parent_id = null) and topics (has parent_id)
      const mainSubjects = folders?.filter(f => !f.parent_id) || [];
      const topics = folders?.filter(f => f.parent_id) || [];

      // Build the structure
      const structuredSubjects: SubjectWithTopics[] = mainSubjects.map(subject => {
        const subjectTopics = topics
          .filter(t => t.parent_id === subject.id)
          .map(t => ({
            ...t,
            progress: progressMap.get(t.id),
          }));

        const completedCount = subjectTopics.filter(
          t => t.progress?.status === 'completed'
        ).length;

        return {
          id: subject.id,
          name: subject.name,
          description: subject.description,
          topics: subjectTopics,
          completedCount,
          totalCount: subjectTopics.length,
        };
      });

      // Filter out subjects with no topics
      const subjectsWithTopics = structuredSubjects.filter(s => s.totalCount > 0);
      
      setSubjects(subjectsWithTopics);
      
      // Expand all subjects by default
      setExpandedSubjects(new Set(subjectsWithTopics.map(s => s.id)));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar o plano de estudos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (folderId: string, newStatus: StudyStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upsert the progress record
      const { error } = await supabase
        .from('study_progress')
        .upsert({
          user_id: user.id,
          folder_id: folderId,
          status: newStatus,
          last_studied_at: new Date().toISOString(),
          study_sessions: newStatus === 'in_progress' ? 1 : undefined,
        }, {
          onConflict: 'user_id,folder_id',
        });

      if (error) throw error;

      // Update local state
      setSubjects(prev => prev.map(subject => ({
        ...subject,
        topics: subject.topics.map(topic => 
          topic.id === folderId 
            ? { 
                ...topic, 
                progress: { 
                  ...topic.progress,
                  id: topic.progress?.id || '',
                  user_id: user.id,
                  folder_id: folderId,
                  status: newStatus,
                  priority: topic.progress?.priority || 'medium',
                  last_studied_at: new Date().toISOString(),
                  study_sessions: topic.progress?.study_sessions || 0,
                  notes: topic.progress?.notes || null,
                  created_at: topic.progress?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                } as StudyProgress
              }
            : topic
        ),
        completedCount: subject.topics.filter(t => 
          t.id === folderId ? newStatus === 'completed' : t.progress?.status === 'completed'
        ).length,
      })));

      toast({
        title: 'Status atualizado',
        description: `Tópico marcado como "${getStatusLabel(newStatus)}"`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  };

  const handlePriorityChange = async (folderId: string, newPriority: StudyPriority) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('study_progress')
        .upsert({
          user_id: user.id,
          folder_id: folderId,
          priority: newPriority,
        }, {
          onConflict: 'user_id,folder_id',
        });

      if (error) throw error;

      setSubjects(prev => prev.map(subject => ({
        ...subject,
        topics: subject.topics.map(topic => 
          topic.id === folderId 
            ? { 
                ...topic, 
                progress: { 
                  ...topic.progress,
                  id: topic.progress?.id || '',
                  user_id: user.id,
                  folder_id: folderId,
                  status: topic.progress?.status || 'not_started',
                  priority: newPriority,
                  last_studied_at: topic.progress?.last_studied_at || null,
                  study_sessions: topic.progress?.study_sessions || 0,
                  notes: topic.progress?.notes || null,
                  created_at: topic.progress?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                } as StudyProgress
              }
            : topic
        ),
      })));

      toast({
        title: 'Prioridade atualizada',
        description: `Prioridade alterada para "${getPriorityLabel(newPriority)}"`,
      });
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleNotesChange = async (folderId: string, notes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('study_progress')
        .upsert({
          user_id: user.id,
          folder_id: folderId,
          notes,
        }, {
          onConflict: 'user_id,folder_id',
        });

      if (error) throw error;

      setSubjects(prev => prev.map(subject => ({
        ...subject,
        topics: subject.topics.map(topic => 
          topic.id === folderId 
            ? { 
                ...topic, 
                progress: { 
                  ...topic.progress,
                  notes,
                } as StudyProgress
              }
            : topic
        ),
      })));
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const suggestNextTopic = () => {
    // Find the best topic to study based on priority and status
    const allTopics: { topic: FolderWithProgress; subjectName: string }[] = [];
    
    subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        allTopics.push({ topic, subjectName: subject.name });
      });
    });

    // Priority order: high priority not_started > high priority review > medium priority not_started, etc.
    const priorityScore = { high: 3, medium: 2, low: 1 };
    const statusScore = { not_started: 2, review: 1.5, in_progress: 1, completed: 0 };

    const scoredTopics = allTopics
      .filter(({ topic }) => (topic.progress?.status || 'not_started') !== 'completed')
      .map(({ topic, subjectName }) => ({
        topic,
        subjectName,
        score: 
          priorityScore[topic.progress?.priority || 'medium'] * 
          statusScore[topic.progress?.status || 'not_started'],
      }))
      .sort((a, b) => b.score - a.score);

    if (scoredTopics.length > 0) {
      const suggested = scoredTopics[0];
      toast({
        title: '💡 Sugestão de Estudo',
        description: `${suggested.subjectName}: ${suggested.topic.name}`,
        duration: 5000,
      });
    } else {
      toast({
        title: '🎉 Parabéns!',
        description: 'Você concluiu todos os tópicos!',
      });
    }
  };

  const getStatusLabel = (status: StudyStatus) => {
    const labels = {
      not_started: 'A iniciar',
      in_progress: 'Estudando',
      completed: 'Concluído',
      review: 'Revisão',
    };
    return labels[status];
  };

  const getPriorityLabel = (priority: StudyPriority) => {
    const labels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
    return labels[priority];
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  // Calculate totals
  const totals = useMemo(() => {
    let completed = 0;
    let total = 0;
    subjects.forEach(s => {
      completed += s.completedCount;
      total += s.totalCount;
    });
    return { completed, total };
  }, [subjects]);

  // Filter topics
  const filteredSubjects = useMemo(() => {
    return subjects.map(subject => ({
      ...subject,
      topics: subject.topics.filter(topic => {
        const status = topic.progress?.status || 'not_started';
        const priority = topic.progress?.priority || 'medium';
        
        const statusMatch = filterStatus === 'all' || status === filterStatus;
        const priorityMatch = filterPriority === 'all' || priority === filterPriority;
        
        return statusMatch && priorityMatch;
      }),
    })).filter(subject => subject.topics.length > 0);
  }, [subjects, filterStatus, filterPriority]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando plano de estudos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">📚 Plano de Estudos</h1>
            <p className="text-muted-foreground text-sm">
              Acompanhe seu progresso e organize seus estudos
            </p>
          </div>
          <Button onClick={suggestNextTopic} className="gap-2">
            <Sparkles className="w-4 h-4" />
            O que estudar agora?
          </Button>
        </div>

        {/* Overall Progress */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progresso Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <StudyProgressBar 
              completed={totals.completed} 
              total={totals.total} 
            />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtros:</span>
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="not_started">A iniciar</SelectItem>
              <SelectItem value="in_progress">Estudando</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="review">Revisão</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as FilterPriority)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subjects List */}
        {filteredSubjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {subjects.length === 0 
                  ? 'Nenhuma matéria com tópicos encontrada. Crie subpastas dentro das suas matérias para usar o plano de estudos.'
                  : 'Nenhum tópico encontrado com os filtros selecionados.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSubjects.map(subject => (
              <Collapsible
                key={subject.id}
                open={expandedSubjects.has(subject.id)}
                onOpenChange={() => toggleSubject(subject.id)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedSubjects.has(subject.id) ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <CardTitle className="text-lg">{subject.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                          <StudyProgressBar
                            completed={subject.completedCount}
                            total={subject.totalCount}
                            className="w-32"
                            showLabel={false}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {subject.completedCount}/{subject.totalCount}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {subject.topics.map(topic => (
                          <StudyTopicCard
                            key={topic.id}
                            id={topic.id}
                            name={topic.name}
                            status={topic.progress?.status || 'not_started'}
                            priority={topic.progress?.priority || 'medium'}
                            lastStudiedAt={topic.progress?.last_studied_at}
                            notes={topic.progress?.notes}
                            studySessions={topic.progress?.study_sessions || 0}
                            onStatusChange={handleStatusChange}
                            onPriorityChange={handlePriorityChange}
                            onNotesChange={handleNotesChange}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
