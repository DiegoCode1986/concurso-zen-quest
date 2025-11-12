import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { format, differenceInMinutes, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
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

interface StatisticsPageProps {
  onBack?: () => void;
}

export const StatisticsPage = ({ onBack }: StatisticsPageProps) => {
  const [records, setRecords] = useState<TimeclockRecord[]>([]);
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecords(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar registros',
        description: error.message,
        variant: 'destructive',
      });
    }
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
              <BarChart3 className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-semibold">Estatísticas</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
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
      </main>
    </div>
  );
};
