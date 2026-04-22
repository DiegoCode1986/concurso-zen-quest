import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface FolderStatsCardProps {
  folderId: string;
  refreshKey?: number;
}

export const FolderStatsCard = ({ folderId, refreshKey = 0 }: FolderStatsCardProps) => {
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('folder_attempts')
        .select('is_correct')
        .eq('user_id', user.id)
        .eq('folder_id', folderId);

      if (error) throw error;

      const c = (data || []).filter((d) => d.is_correct).length;
      const w = (data || []).filter((d) => !d.is_correct).length;
      setCorrect(c);
      setWrong(w);
    } catch (error: any) {
      console.error('Error fetching folder stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [folderId, refreshKey]);

  const handleReset = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('folder_attempts')
        .delete()
        .eq('user_id', user.id)
        .eq('folder_id', folderId);

      if (error) throw error;

      setCorrect(0);
      setWrong(0);
      toast({
        title: 'Estatísticas reiniciadas',
        description: 'Você pode resolver as questões novamente do zero.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao reiniciar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const total = correct + wrong;
  const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrongPct = total > 0 ? 100 - correctPct : 0;

  const data = [
    { name: 'Acertos', value: correct, color: 'hsl(142, 71%, 45%)' },
    { name: 'Erros', value: wrong, color: 'hsl(0, 84%, 60%)' },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Desempenho neste caderno
        </CardTitle>
        {total > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reiniciar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reiniciar estatísticas?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apagará todos os registros de acertos e erros desta pasta. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reiniciar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : total === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p>Nenhuma resposta registrada ainda.</p>
            <p className="text-xs mt-1">Responda as questões abaixo para ver suas estatísticas.</p>
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} (${name === 'Acertos' ? correctPct : wrongPct}%)`, name]}
                />
                <Legend verticalAlign="top" height={32} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
              <span className="text-2xl font-bold" style={{ color: 'hsl(142, 71%, 45%)' }}>{correctPct}%</span>
              <span className="text-lg font-semibold" style={{ color: 'hsl(0, 84%, 60%)' }}>{wrongPct}%</span>
            </div>
            <div className="mt-3 flex justify-center gap-6 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{correct}</span> acertos
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{wrong}</span> erros
              </span>
              <span className="text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{total}</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
