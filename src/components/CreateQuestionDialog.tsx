import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';

const questionSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Título é obrigatório')
    .max(1000, 'Título deve ter no máximo 1000 caracteres'),
  type: z.enum(['multiple_choice', 'true_false'], {
    required_error: 'Tipo de questão é obrigatório',
  }),
  explanation: z.string()
    .max(2000, 'Explicação deve ter no máximo 2000 caracteres')
    .optional(),
});

const multipleChoiceSchema = questionSchema.extend({
  options: z.array(z.string().trim().min(1, 'Opção não pode estar vazia'))
    .min(2, 'Deve ter pelo menos 2 opções')
    .max(5, 'Máximo de 5 opções permitidas'),
  correct_answer: z.string().min(1, 'Resposta correta é obrigatória'),
});

const trueFalseSchema = questionSchema.extend({
  correct_boolean: z.boolean({
    required_error: 'Resposta correta é obrigatória',
  }),
});

interface CreateQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  onSuccess: () => void;
  editQuestion?: {
    id: string;
    title: string;
    type: 'multiple_choice' | 'true_false';
    options: string[] | null;
    correct_answer: string | null;
    correct_boolean: boolean | null;
    explanation: string | null;
  } | null;
}

export const CreateQuestionDialog = ({ open, onOpenChange, folderId, onSuccess, editQuestion }: CreateQuestionDialogProps) => {
  const [formData, setFormData] = useState({
    title: editQuestion?.title || '',
    type: editQuestion?.type || ('' as 'multiple_choice' | 'true_false' | ''),
    options: editQuestion?.options || ['', ''],
    correct_answer: editQuestion?.correct_answer || '',
    correct_boolean: editQuestion?.correct_boolean,
    explanation: editQuestion?.explanation || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      title: '',
      type: '',
      options: ['', ''],
      correct_answer: '',
      correct_boolean: undefined,
      explanation: '',
    });
  };

  // Update form when editQuestion changes
  useEffect(() => {
    if (editQuestion) {
      setFormData({
        title: editQuestion.title,
        type: editQuestion.type,
        options: editQuestion.options || ['', ''],
        correct_answer: editQuestion.correct_answer || '',
        correct_boolean: editQuestion.correct_boolean,
        explanation: editQuestion.explanation || '',
      });
    } else if (open) {
      resetForm();
    }
  }, [editQuestion, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate based on question type
      if (formData.type === 'multiple_choice') {
        const validation = multipleChoiceSchema.safeParse({
          ...formData,
          options: formData.options.filter(option => option.trim() !== ''),
        });
        if (!validation.success) {
          toast({
            title: 'Dados inválidos',
            description: validation.error.errors[0].message,
            variant: 'destructive',
          });
          return;
        }
      } else if (formData.type === 'true_false') {
        const validation = trueFalseSchema.safeParse(formData);
        if (!validation.success) {
          toast({
            title: 'Dados inválidos',
            description: validation.error.errors[0].message,
            variant: 'destructive',
          });
          return;
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      if (editQuestion) {
        // Update existing question
        const questionData = {
          title: formData.title,
          type: formData.type,
          explanation: formData.explanation || null,
          ...(formData.type === 'multiple_choice' 
            ? {
                options: formData.options.filter(option => option.trim() !== ''),
                correct_answer: formData.correct_answer,
                correct_boolean: null,
              }
            : {
                options: null,
                correct_answer: null,
                correct_boolean: formData.correct_boolean,
              }
          ),
        };

        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editQuestion.id);

        if (error) throw error;

        toast({
          title: 'Questão atualizada!',
          description: 'Sua questão foi atualizada com sucesso.',
        });
      } else {
        // Create new question
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('Usuário não autenticado');
        }

        const questionData = {
          title: formData.title,
          type: formData.type,
          folder_id: folderId,
          user_id: userData.user.id,
          explanation: formData.explanation || null,
          ...(formData.type === 'multiple_choice' 
            ? {
                options: formData.options.filter(option => option.trim() !== ''),
                correct_answer: formData.correct_answer,
                correct_boolean: null,
              }
            : {
                options: null,
                correct_answer: null,
                correct_boolean: formData.correct_boolean,
              }
          ),
        };

        const { error } = await supabase.from('questions').insert(questionData);

        if (error) throw error;

        toast({
          title: 'Questão criada!',
          description: 'Sua nova questão foi criada com sucesso.',
        });
      }

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar questão',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addOption = () => {
    if (formData.options.length < 5) {
      setFormData({
        ...formData,
        options: [...formData.options, ''],
      });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions,
        correct_answer: formData.correct_answer === formData.options[index] ? '' : formData.correct_answer,
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Questão</DialogTitle>
          <DialogDescription>
            Crie uma nova questão para esta matéria.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Question Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Enunciado da questão *</Label>
              <Textarea
                id="title"
                placeholder="Digite o enunciado da questão..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={1000}
                rows={3}
              />
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <Label>Tipo de questão *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'multiple_choice' | 'true_false') => 
                  setFormData({ 
                    ...formData, 
                    type: value,
                    correct_answer: '',
                    correct_boolean: undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de questão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
                  <SelectItem value="true_false">Verdadeiro ou Falso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multiple Choice Options */}
            {formData.type === 'multiple_choice' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Opções de resposta *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={formData.options.length >= 5}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar opção
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm font-medium min-w-[24px]">
                        {String.fromCharCode(65 + index)})
                      </span>
                      <Input
                        placeholder={`Opção ${String.fromCharCode(65 + index)}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        required
                      />
                      {formData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Correct Answer Selection */}
                <div className="space-y-2">
                  <Label>Resposta correta *</Label>
                  <RadioGroup
                    value={formData.correct_answer}
                    onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                  >
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={option} 
                          id={`option-${index}`}
                          disabled={!option.trim()}
                        />
                        <Label htmlFor={`option-${index}`} className="text-sm">
                          {String.fromCharCode(65 + index)}) {option || 'Digite a opção acima'}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* True/False Selection */}
            {formData.type === 'true_false' && (
              <div className="space-y-2">
                <Label>Resposta correta *</Label>
                <RadioGroup
                  value={formData.correct_boolean?.toString()}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    correct_boolean: value === 'true' 
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true">Verdadeiro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false">Falso</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Explanation */}
            <div className="space-y-2">
              <Label htmlFor="explanation">Explicação (opcional)</Label>
              <Textarea
                id="explanation"
                placeholder="Adicione uma explicação para a resposta..."
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                maxLength={2000}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} variant="gradient">
              {isLoading ? (editQuestion ? 'Salvando...' : 'Criando...') : (editQuestion ? 'Salvar' : 'Criar questão')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};