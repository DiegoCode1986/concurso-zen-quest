import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  created_at: string;
}

export const FlashcardsPage = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCard, setNewCard] = useState({ front: '', back: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      // Por enquanto, vamos usar localStorage até criar a tabela no banco
      const stored = localStorage.getItem('flashcards');
      if (stored) {
        setFlashcards(JSON.parse(stored));
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar flashcards',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFlashcards = (cards: Flashcard[]) => {
    localStorage.setItem('flashcards', JSON.stringify(cards));
    setFlashcards(cards);
  };

  const handleCreateFlashcard = () => {
    if (!newCard.front.trim() || !newCard.back.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o texto da frente e do verso.',
        variant: 'destructive',
      });
      return;
    }

    const flashcard: Flashcard = {
      id: Date.now().toString(),
      front: newCard.front,
      back: newCard.back,
      created_at: new Date().toISOString(),
    };

    const updated = [...flashcards, flashcard];
    saveFlashcards(updated);
    setNewCard({ front: '', back: '' });
    setIsDialogOpen(false);
    toast({
      title: 'Flashcard criado!',
      description: 'Seu novo flashcard foi adicionado.',
    });
  };

  const handleDeleteFlashcard = () => {
    const updated = flashcards.filter((_, idx) => idx !== currentIndex);
    saveFlashcards(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
    setIsFlipped(false);
    toast({
      title: 'Flashcard excluído',
      description: 'O flashcard foi removido.',
    });
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flash Cards</h1>
          <p className="text-muted-foreground">
            {flashcards.length > 0 ? `Card ${currentIndex + 1} de ${flashcards.length}` : 'Nenhum flashcard criado'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Flashcard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Flashcard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="front">Frente (Pergunta)</Label>
                <Textarea
                  id="front"
                  value={newCard.front}
                  onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                  placeholder="Digite a pergunta ou conceito..."
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="back">Verso (Resposta)</Label>
                <Textarea
                  id="back"
                  value={newCard.back}
                  onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                  placeholder="Digite a resposta..."
                  className="mt-2"
                />
              </div>
              <Button onClick={handleCreateFlashcard} className="w-full">
                Criar Flashcard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Flashcard Display */}
      {flashcards.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <Card className="p-8 max-w-md text-center">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum flashcard ainda</h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro flashcard para começar a memorizar conteúdos.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro flashcard
            </Button>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Flashcard */}
          <Card
            className="flex-1 p-8 cursor-pointer transition-all duration-300 hover:shadow-lg mb-6 flex flex-col items-center justify-center relative"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="absolute top-4 right-4">
              {isFlipped ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            <div className="text-center max-w-2xl">
              <p className="text-sm text-muted-foreground mb-4">
                {isFlipped ? 'Resposta' : 'Pergunta'}
              </p>
              <p className="text-xl font-medium">
                {isFlipped ? flashcards[currentIndex].back : flashcards[currentIndex].front}
              </p>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Clique para {isFlipped ? 'ocultar' : 'revelar'} a resposta
            </p>
          </Card>

          {/* Controls */}
          <div className="flex gap-3">
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
              onClick={handleDeleteFlashcard}
              variant="destructive"
              size="icon"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="flex-1"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
