import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, Play, Square, Trash2 } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MobileNav } from '@/components/MobileNav';

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