import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Play, Square, Trash2, BarChart3, TrendingUp } from 'lucide-react';
import { format, differenceInMinutes, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MobileNav } from '@/components/MobileNav';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeclockRecord {
  id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  created_at: string;
}

interface TimeclockPageProps {
  onBack?: () => void;
}

export const TimeclockPage = ({ onBack }: TimeclockPageProps) => {
  const [records, setRecords] = useState<TimeclockRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<TimeclockRecord | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('week');
  const { toast } = useToast();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('timeclock')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const records = data || [];
      setRecords(records);
      
      // Find active record (clock_out is null)
      const active = records.find(r => !r.clock_out);
      setActiveRecord(active || null);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar registros',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleClockIn = async () => {
    if (activeRecord) {
      toast({
        title: 'Você já bateu o ponto de entrada',
        description: 'Finalize o ponto atual antes de iniciar outro.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('timeclock')
        .insert([
          {
            user_id: user.id,
            notes: notes || null,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setActiveRecord(data);
      setNotes('');
      toast({
        title: 'Ponto batido!',
        description: 'Entrada registrada com sucesso.',
      });
      
      fetchRecords();
    } catch (error: any) {
      toast({
        title: 'Erro ao bater ponto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeRecord) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('timeclock')
        .update({ clock_out: new Date().toISOString(), notes: notes || activeRecord.notes })
        .eq('id', activeRecord.id);

      if (error) throw error;

      setActiveRecord(null);
      setNotes('');
      toast({
        title: 'Saída registrada!',
        description: 'Ponto finalizado com sucesso.',
      });
      
      fetchRecords();
    } catch (error: any) {
      toast({
        title: 'Erro ao finalizar ponto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('timeclock')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Registro excluído',
        description: 'O registro foi removido com sucesso.',
      });
      
      fetchRecords();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const minutes = differenceInMinutes(end, start);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const calculateTotalMinutes = (clockIn: string, clockOut: string | null) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    return differenceInMinutes(end, start);
  };

  const getStatsData = () => {
    const now = new Date();
    const completedRecords = records.filter(r => r.clock_out);

    if (statsPeriod === 'day') {
      // Últimos 7 dias
      const days = eachDayOfInterval({
        start: startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)),
        end: endOfDay(now)
      });

      return days.map(day => {
        const dayRecords = completedRecords.filter(r => {
          const recordDate = new Date(r.clock_in);
          return recordDate >= startOfDay(day) && recordDate <= endOfDay(day);
        });
        const totalMinutes = dayRecords.reduce((sum, r) => sum + calculateTotalMinutes(r.clock_in, r.clock_out), 0);
        return {
          label: format(day, 'dd/MM', { locale: ptBR }),
          hours: Number((totalMinutes / 60).toFixed(1))
        };
      });
    } else if (statsPeriod === 'week') {
      // Últimas 8 semanas
      const weeks = eachWeekOfInterval({
        start: startOfWeek(new Date(now.getTime() - 7 * 7 * 24 * 60 * 60 * 1000), { locale: ptBR }),
        end: endOfWeek(now, { locale: ptBR })
      }, { locale: ptBR });

      return weeks.map(week => {
        const weekEnd = endOfWeek(week, { locale: ptBR });
        const weekRecords = completedRecords.filter(r => {
          const recordDate = new Date(r.clock_in);
          return recordDate >= week && recordDate <= weekEnd;
        });
        const totalMinutes = weekRecords.reduce((sum, r) => sum + calculateTotalMinutes(r.clock_in, r.clock_out), 0);
        return {
          label: format(week, "'Sem' dd/MM", { locale: ptBR }),
          hours: Number((totalMinutes / 60).toFixed(1))
        };
      });
    } else {
      // Últimos 12 meses
      const months = eachMonthOfInterval({
        start: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1)),
        end: endOfMonth(now)
      });

      return months.map(month => {
        const monthEnd = endOfMonth(month);
        const monthRecords = completedRecords.filter(r => {
          const recordDate = new Date(r.clock_in);
          return recordDate >= startOfMonth(month) && recordDate <= monthEnd;
        });
        const totalMinutes = monthRecords.reduce((sum, r) => sum + calculateTotalMinutes(r.clock_in, r.clock_out), 0);
        return {
          label: format(month, 'MMM/yy', { locale: ptBR }),
          hours: Number((totalMinutes / 60).toFixed(1))
        };
      });
    }
  };

  const getTotalStats = () => {
    const now = new Date();
    const completedRecords = records.filter(r => r.clock_out);

    const todayRecords = completedRecords.filter(r => {
      const recordDate = new Date(r.clock_in);
      return recordDate >= startOfDay(now) && recordDate <= endOfDay(now);
    });

    const weekRecords = completedRecords.filter(r => {
      const recordDate = new Date(r.clock_in);
      return recordDate >= startOfWeek(now, { locale: ptBR }) && recordDate <= endOfWeek(now, { locale: ptBR });
    });

    const monthRecords = completedRecords.filter(r => {
      const recordDate = new Date(r.clock_in);
      return recordDate >= startOfMonth(now) && recordDate <= endOfMonth(now);
    });

    const calculateTotal = (recs: TimeclockRecord[]) => {
      const totalMinutes = recs.reduce((sum, r) => sum + calculateTotalMinutes(r.clock_in, r.clock_out), 0);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h ${mins}min`;
    };

    return {
      today: calculateTotal(todayRecords),
      week: calculateTotal(weekRecords),
      month: calculateTotal(monthRecords)
    };
  };

  const stats = getTotalStats();
  const chartData = getStatsData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="lg:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <MobileNav 
              currentView="dashboard" 
              onNavigate={(view) => {
                if (view === 'dashboard' && onBack) {
                  onBack();
                }
              }} 
            />
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-semibold">Bater Ponto</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Clock In/Out Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {activeRecord ? 'Ponto Ativo' : 'Registrar Entrada'}
            </h2>
            {activeRecord && (
              <div className="text-sm text-muted-foreground">
                Entrada: {format(new Date(activeRecord.clock_in), 'HH:mm', { locale: ptBR })}
              </div>
            )}
          </div>

          {activeRecord && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Tempo decorrido</p>
                <p className="text-2xl font-bold text-primary">
                  {calculateDuration(activeRecord.clock_in, null)}
                </p>
              </div>
            </div>
          )}

          <Textarea
            placeholder={activeRecord ? "Adicionar observações (opcional)" : "Observações sobre esta sessão de estudo (opcional)"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />

          {activeRecord ? (
            <Button
              onClick={handleClockOut}
              disabled={loading}
              className="w-full"
              size="lg"
              variant="destructive"
            >
              <Square className="w-5 h-5 mr-2" />
              Registrar Saída
            </Button>
          ) : (
            <Button
              onClick={handleClockIn}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Registrar Entrada
            </Button>
          )}
        </Card>

        {/* Statistics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Estatísticas de Estudo</h2>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold text-primary">{stats.today}</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Esta Semana</p>
                  <p className="text-2xl font-bold text-primary">{stats.week}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl font-bold text-primary">{stats.month}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-6">
            <Tabs value={statsPeriod} onValueChange={(v) => setStatsPeriod(v as 'day' | 'week' | 'month')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Horas Estudadas</h3>
                <TabsList>
                  <TabsTrigger value="day">Por Dia</TabsTrigger>
                  <TabsTrigger value="week">Por Semana</TabsTrigger>
                  <TabsTrigger value="month">Por Mês</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={statsPeriod} className="mt-0">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        label={{ value: 'Horas', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          color: 'hsl(var(--card-foreground))'
                        }}
                        formatter={(value: number) => [`${value}h`, 'Horas']}
                      />
                      <Bar 
                        dataKey="hours" 
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Histórico</h2>
          
          {records.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum registro ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Comece batendo seu primeiro ponto acima
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <Card key={record.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Entrada: </span>
                          <span className="font-medium">
                            {format(new Date(record.clock_in), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        
                        {record.clock_out && (
                          <div>
                            <span className="text-muted-foreground">Saída: </span>
                            <span className="font-medium">
                              {format(new Date(record.clock_out), 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">
                          {calculateDuration(record.clock_in, record.clock_out)}
                        </span>
                        {!record.clock_out && (
                          <span className="text-xs text-muted-foreground">(em andamento)</span>
                        )}
                      </div>

                      {record.notes && (
                        <p className="text-sm text-muted-foreground">{record.notes}</p>
                      )}
                    </div>

                    {record.clock_out && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(record.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};