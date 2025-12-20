import { useState, useEffect } from 'react';
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
  parentId?: string;
  parentName?: string;
}

export const CreateFolderDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  editFolder,
  parentId,
  parentName,
}: CreateFolderDialogProps) => {
  const [formData, setFormData] = useState({
    name: editFolder?.name || '',
    description: editFolder?.description || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isSubfolder = !!parentId;
  const itemLabel = isSubfolder ? 'Tema' : 'Matéria';
  const itemLabelLower = isSubfolder ? 'tema' : 'matéria';

  // Update form when editFolder changes
  useEffect(() => {
    if (editFolder) {
      setFormData({
        name: editFolder.name,
        description: editFolder.description || '',
      });
    } else if (open) {
      setFormData({
        name: '',
        description: '',
      });
    }
  }, [editFolder, open]);

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
          title: `${itemLabel} atualizado!`,
          description: `Seu ${itemLabelLower} foi atualizado com sucesso.`,
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
          parent_id: parentId || null,
        });

        if (error) throw error;

        toast({
          title: `${itemLabel} criado!`,
          description: `Seu novo ${itemLabelLower} foi criado com sucesso.`,
        });
      }

      setFormData({ name: '', description: '' });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: `Erro ao criar ${itemLabelLower}`,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDialogTitle = () => {
    if (editFolder) {
      return `Editar ${itemLabel}`;
    }
    return isSubfolder ? `Novo Tema em "${parentName}"` : 'Nova Matéria';
  };

  const getDialogDescription = () => {
    if (editFolder) {
      return `Edite as informações do seu ${itemLabelLower}.`;
    }
    return isSubfolder 
      ? 'Crie um novo tema para organizar suas questões dentro desta matéria.'
      : 'Crie uma nova matéria para organizar suas questões de estudo.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do {itemLabelLower} *</Label>
              <Input
                id="name"
                placeholder={isSubfolder ? 'Ex: Álgebra Linear' : 'Ex: Direito Constitucional'}
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
                placeholder={`Adicione uma descrição para este ${itemLabelLower}...`}
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
              {isLoading 
                ? (editFolder ? 'Salvando...' : 'Criando...') 
                : (editFolder ? 'Salvar' : `Criar ${itemLabelLower}`)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
