import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface StudyTimerProps {
  folderName: string;
}

export const StudyTimer = ({ folderName }: StudyTimerProps) => {
  const [totalSeconds, setTotalSeconds] = useState(1500); // 25 min default (Pomodoro)
  const [remainingSeconds, setRemainingSeconds] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(25);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Timer finished notification
            toast({
              title: 'Tempo de estudo concluído!',
              description: `Você estudou ${folderName} por ${formatTime(totalSeconds)}. Parabéns!`,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, remainingSeconds, folderName, totalSeconds, toast]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (remainingSeconds === 0) {
      // If timer finished, reset first
      handleReset();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(false);
  };

  const handleSetTime = () => {
    const newSeconds = inputMinutes * 60;
    setTotalSeconds(newSeconds);
    setRemainingSeconds(newSeconds);
    setIsRunning(false);
    setIsConfiguring(false);
    toast({
      title: 'Tempo configurado',
      description: `Timer ajustado para ${inputMinutes} minutos`,
    });
  };

  const setPresetTime = (minutes: number) => {
    const newSeconds = minutes * 60;
    setTotalSeconds(newSeconds);
    setRemainingSeconds(newSeconds);
    setInputMinutes(minutes);
    setIsRunning(false);
    toast({
      title: 'Tempo configurado',
      description: `Timer ajustado para ${minutes} minutos`,
    });
  };

  const getTimerColor = () => {
    const percentage = remainingSeconds / totalSeconds;
    if (percentage > 0.5) return 'text-subject-green';
    if (percentage > 0.25) return 'text-primary';
    if (percentage > 0.1) return 'text-orange-500';
    return 'text-destructive';
  };

  const getProgress = () => {
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-3 sm:p-4 border border-border/50">
      {/* Progress bar */}
      <div className="w-full bg-muted/30 rounded-full h-1 mb-3 sm:mb-4">
        <div 
          className="bg-gradient-to-r from-primary to-accent h-1 rounded-full transition-all duration-300"
          style={{ width: `${getProgress()}%` }}
        />
      </div>

      {/* Mobile Layout */}
      <div className="block sm:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Cronômetro</span>
          </div>
          <Badge variant="outline" className="text-xs max-w-[120px] truncate">
            {folderName}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className={`text-xl font-mono font-bold ${getTimerColor()}`}>
            {formatTime(remainingSeconds)}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfiguring(!isConfiguring)}
              className="h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="h-8 w-8 p-0"
              disabled={remainingSeconds === 0 && !isRunning}
            >
              {isRunning ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Cronômetro de Estudo</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {folderName}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
            {formatTime(remainingSeconds)}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfiguring(!isConfiguring)}
              className="h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="h-8 w-8 p-0"
              disabled={remainingSeconds === 0 && !isRunning}
            >
              {isRunning ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      {isConfiguring && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
          <div className="flex flex-col gap-3">
            {/* Quick preset buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Tempos rápidos:</span>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1 sm:gap-2">
                {[15, 25, 30, 45, 60, 90].map((minutes) => (
                  <Button
                    key={minutes}
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetTime(minutes)}
                    className="h-7 px-2 sm:px-3 text-xs"
                  >
                    {minutes}min
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Custom time input */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="180"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(Number(e.target.value))}
                  className="w-20 h-8"
                  placeholder="Min"
                />
                <span className="text-xs sm:text-sm text-muted-foreground">minutos</span>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleSetTime}
                className="h-8 px-3 w-full sm:w-auto"
              >
                Definir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};