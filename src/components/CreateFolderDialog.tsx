import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const folderSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
});

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editFolder?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export const CreateFolderDialog = ({ open, onOpenChange, onSuccess, editFolder }: CreateFolderDialogProps) => {
  const [formData, setFormData] = useState({
    name: editFolder?.name || '',
    description: editFolder?.description || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Update form when editFolder changes
  useState(() => {
    if (editFolder) {
      setFormData({
        name: editFolder.name,
        description: editFolder.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input
      const validation = folderSchema.safeParse(formData);
      if (!validation.success) {
        toast({
          title: 'Dados inválidos',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }

      if (editFolder) {
        // Update existing folder
        const { error } = await supabase
          .from('folders')
          .update({
            name: validation.data.name,
            description: validation.data.description || null,
          })
          .eq('id', editFolder.id);

        if (error) throw error;

        toast({
          title: 'Matéria atualizada!',
          description: 'Sua matéria foi atualizada com sucesso.',
        });
      } else {
        // Create new folder
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('Usuário não autenticado');
        }

        const { error } = await supabase.from('folders').insert({
          name: validation.data.name,
          description: validation.data.description || null,
          user_id: userData.user.id,
        });

        if (error) throw error;

        toast({
          title: 'Matéria criada!',
          description: 'Sua nova matéria foi criada com sucesso.',
        });
      }

      setFormData({ name: '', description: '' });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar matéria',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editFolder ? 'Editar Matéria' : 'Nova Matéria'}</DialogTitle>
          <DialogDescription>
            {editFolder ? 'Edite as informações da sua matéria.' : 'Crie uma nova matéria para organizar suas questões de estudo.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da matéria *</Label>
              <Input
                id="name"
                placeholder="Ex: Direito Constitucional"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Adicione uma descrição para esta matéria..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} variant="gradient">
              {isLoading ? (editFolder ? 'Salvando...' : 'Criando...') : (editFolder ? 'Salvar' : 'Criar matéria')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};