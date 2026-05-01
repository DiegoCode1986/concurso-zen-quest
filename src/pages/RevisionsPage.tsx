import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Trash2, CalendarClock, Hourglass, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RevisionsPageProps {
  onBack: () => void;
}

interface Revision {
  id: string;
  subject: string;
  topic: string;
  study_date: string;
  review_1_date: string;
  review_2_date: string;
  review_3_date: string;
  review_4_date: string;
  review_1_done: boolean;
  review_2_done: boolean;
  review_3_done: boolean;
  review_4_done: boolean;
  notes: string | null;
  created_at: string;
}

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const formatBR = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

type CellStatus = 'done' | 'overdue' | 'today' | 'upcoming';

const getCellStatus = (date: string, done: boolean): CellStatus => {
  if (done) return 'done';
  const t = todayISO();
  if (date < t) return 'overdue';
  if (date === t) return 'today';
  return 'upcoming';
};

const cellClasses: Record<CellStatus, string> = {
  done: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  overdue: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  today: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-500/40',
  upcoming: 'bg-muted/40 text-muted-foreground border-border',
};

const getRowStatus = (r: Revision): { label: string; variant: CellStatus; icon: any } => {
  const allDone = r.review_1_done && r.review_2_done && r.review_3_done && r.review_4_done;
  if (allDone) return { label: 'Concluído', variant: 'done', icon: CheckCircle2 };

  const t = todayISO();
  let hasToday = false;
  for (let i = 1; i <= 4; i++) {
    const date = (r as any)[`review_${i}_date`];
    const done = (r as any)[`review_${i}_done`];
    if (done) continue;
    if (date < t) return { label: 'Atrasado', variant: 'overdue', icon: AlertTriangle };
    if (date === t) hasToday = true;
  }
  if (hasToday) return { label: 'Hoje', variant: 'today', icon: CalendarClock };
  return { label: 'Em dia', variant: 'upcoming', icon: Hourglass };
};

export const RevisionsPage = ({ onBack }: RevisionsPageProps) => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'done'>('all');
  const [search, setSearch] = useState('');

  // form
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [studyDate, setStudyDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('revisions')
        .select('*')
        .eq('user_id', user.id)
        .order('study_date', { ascending: false });
      if (error) throw error;
      setRevisions(data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar revisões', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRevisions(); }, []);

  const resetForm = () => {
    setSubject(''); setTopic(''); setStudyDate(todayISO()); setNotes('');
  };

  const handleSave = async () => {
    if (!subject.trim() || !topic.trim() || !studyDate) {
      toast.error('Preencha matéria, assunto e data de estudo.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const payload = {
        user_id: user.id,
        subject: subject.trim(),
        topic: topic.trim(),
        study_date: studyDate,
        review_1_date: addDays(studyDate, 3),
        review_2_date: addDays(studyDate, 7),
        review_3_date: addDays(studyDate, 14),
        review_4_date: addDays(studyDate, 21),
        notes: notes.trim() || null,
      };

      const { error } = await supabase.from('revisions').insert(payload);
      if (error) throw error;

      toast.success('Revisão criada!', {
        description: `Próximas: ${formatBR(payload.review_1_date)}, ${formatBR(payload.review_2_date)}, ${formatBR(payload.review_3_date)}, ${formatBR(payload.review_4_date)}`,
      });
      resetForm();
      setOpen(false);
      fetchRevisions();
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleReview = async (rev: Revision, idx: 1 | 2 | 3 | 4, value: boolean) => {
    const field = `review_${idx}_done` as const;
    setRevisions(prev => prev.map(r => r.id === rev.id ? { ...r, [field]: value } : r));
    const { error } = await supabase.from('revisions').update({ [field]: value }).eq('id', rev.id);
    if (error) {
      toast.error('Erro ao atualizar', { description: error.message });
      fetchRevisions();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('revisions').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir', { description: error.message });
      return;
    }
    toast.success('Revisão excluída');
    setRevisions(prev => prev.filter(r => r.id !== id));
  };

  // filters
  const filtered = revisions.filter(r => {
    const term = search.trim().toLowerCase();
    if (term && !(r.subject.toLowerCase().includes(term) || r.topic.toLowerCase().includes(term))) return false;

    if (filter === 'all') return true;

    const t = todayISO();
    const status = getRowStatus(r).variant;
    if (filter === 'done') return status === 'done';
    if (filter === 'today') {
      // any pending review with date == today OR overdue counts as "needs attention"? user wants today only
      for (let i = 1; i <= 4; i++) {
        const date = (r as any)[`review_${i}_date`];
        const done = (r as any)[`review_${i}_done`];
        if (!done && date === t) return true;
      }
      return false;
    }
    if (filter === 'overdue') {
      for (let i = 1; i <= 4; i++) {
        const date = (r as any)[`review_${i}_date`];
        const done = (r as any)[`review_${i}_done`];
        if (!done && date < t) return true;
      }
      return false;
    }
    return true;
  });

  // counters for tabs
  const counts = (() => {
    const t = todayISO();
    let today = 0, overdue = 0, done = 0;
    revisions.forEach(r => {
      const allDone = r.review_1_done && r.review_2_done && r.review_3_done && r.review_4_done;
      if (allDone) done++;
      let hasToday = false, hasOverdue = false;
      for (let i = 1; i <= 4; i++) {
        const date = (r as any)[`review_${i}_date`];
        const d = (r as any)[`review_${i}_done`];
        if (d) continue;
        if (date < t) hasOverdue = true;
        else if (date === t) hasToday = true;
      }
      if (hasOverdue) overdue++;
      else if (hasToday) today++;
    });
    return { today, overdue, done, all: revisions.length };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-primary" />
              Revisões Espaçadas
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Modelo 3 - 7 - 14 - 21 dias</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-11">
                <Plus className="w-4 h-4 mr-2" /> Nova revisão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar revisão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Matéria</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Português" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Crase" maxLength={150} />
                </div>
                <div className="space-y-2">
                  <Label>Data do estudo</Label>
                  <Input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} />
                  {studyDate && (
                    <p className="text-xs text-muted-foreground">
                      Revisões serão em <strong>{formatBR(addDays(studyDate, 3))}</strong>, <strong>{formatBR(addDays(studyDate, 7))}</strong>, <strong>{formatBR(addDays(studyDate, 14))}</strong> e <strong>{formatBR(addDays(studyDate, 21))}</strong>.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4">
        {/* Alert summary */}
        {(counts.today > 0 || counts.overdue > 0) && (
          <Card className={cn('border-2', counts.overdue > 0 ? 'border-red-500/40 bg-red-500/5' : 'border-yellow-500/40 bg-yellow-500/5')}>
            <CardContent className="py-4 flex items-center gap-3">
              {counts.overdue > 0 ? (
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
              ) : (
                <CalendarClock className="w-6 h-6 text-yellow-600 shrink-0" />
              )}
              <div className="text-sm">
                {counts.overdue > 0 && (
                  <p><strong className="text-red-600 dark:text-red-400">{counts.overdue}</strong> matéria(s) com revisão atrasada.</p>
                )}
                {counts.today > 0 && (
                  <p><strong className="text-yellow-700 dark:text-yellow-300">{counts.today}</strong> matéria(s) para revisar hoje.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
                <TabsTrigger value="all">Todas ({counts.all})</TabsTrigger>
                <TabsTrigger value="today">Hoje ({counts.today})</TabsTrigger>
                <TabsTrigger value="overdue">Atrasadas ({counts.overdue})</TabsTrigger>
                <TabsTrigger value="done">Concluídas ({counts.done})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por matéria ou assunto..."
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarClock className="w-5 h-5 text-primary" />
              Tabela de Revisão (3 - 7 - 14 - 21 dias)
            </CardTitle>
            <CardDescription>Marque cada revisão conforme for concluída.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {revisions.length === 0
                  ? 'Nenhuma revisão criada ainda. Clique em "Nova revisão" para começar.'
                  : 'Nenhuma revisão corresponde ao filtro.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Matéria</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Estudo</TableHead>
                      <TableHead>Rev. 1 (3d)</TableHead>
                      <TableHead>Rev. 2 (7d)</TableHead>
                      <TableHead>Rev. 3 (14d)</TableHead>
                      <TableHead>Rev. 4 (21d)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r, i) => {
                      const status = getRowStatus(r);
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                          <TableCell className="font-medium">{r.subject}</TableCell>
                          <TableCell>{r.topic}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{formatBR(r.study_date)}</TableCell>
                          {([1, 2, 3, 4] as const).map((idx) => {
                            const date = (r as any)[`review_${idx}_date`];
                            const done = (r as any)[`review_${idx}_done`];
                            const cs = getCellStatus(date, done);
                            return (
                              <TableCell key={idx}>
                                <label className={cn('flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer whitespace-nowrap text-sm', cellClasses[cs])}>
                                  <Checkbox
                                    checked={done}
                                    onCheckedChange={(v) => toggleReview(r, idx, !!v)}
                                  />
                                  <span className={cn(done && 'line-through opacity-70')}>{formatBR(date)}</span>
                                </label>
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            <Badge variant="outline" className={cn('gap-1', cellClasses[status.variant])}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir revisão?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A revisão de "{r.subject} - {r.topic}" será removida.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(r.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent className="py-4 flex flex-wrap gap-3 text-xs">
            <span className={cn('px-2 py-1 rounded border', cellClasses.overdue)}>🔴 Atrasado</span>
            <span className={cn('px-2 py-1 rounded border', cellClasses.today)}>🟡 Hoje</span>
            <span className={cn('px-2 py-1 rounded border', cellClasses.done)}>🟢 Concluído</span>
            <span className={cn('px-2 py-1 rounded border', cellClasses.upcoming)}>⏳ Próxima</span>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
