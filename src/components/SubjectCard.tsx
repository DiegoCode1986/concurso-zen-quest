import { useState } from 'react';
import { Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface SubjectCardProps {
  id: string;
  name: string;
  description?: string;
  questionCount: number;
  createdAt: string;
  colorVariant: 'orange' | 'blue' | 'green' | 'red' | 'purple' | 'teal' | 'pink' | 'indigo';
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const gradientClasses = {
  orange: 'bg-gradient-to-br from-subject-orange to-subject-orange-light',
  blue: 'bg-gradient-to-br from-subject-blue to-subject-blue-light',
  green: 'bg-gradient-to-br from-subject-green to-subject-green-light',
  red: 'bg-gradient-to-br from-subject-red to-subject-red-light',
  purple: 'bg-gradient-to-br from-subject-purple to-subject-purple-light',
  teal: 'bg-gradient-to-br from-subject-teal to-subject-teal-light',
  pink: 'bg-gradient-to-br from-subject-pink to-subject-pink-light',
  indigo: 'bg-gradient-to-br from-subject-indigo to-subject-indigo-light',
};

export const SubjectCard = ({
  name,
  description,
  questionCount,
  createdAt,
  colorVariant,
  onClick,
  onEdit,
  onDelete,
}: SubjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-card-hover ${
        isHovered ? 'shadow-card-hover' : 'shadow-card'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Gradient Header */}
      <div className={`h-2 ${gradientClasses[colorVariant]}`} />
      
      <div className="p-6">
        {/* Header with icon and menu */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${gradientClasses[colorVariant]} shadow-lg`}>
            <Folder className="w-6 h-6 text-white" />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground line-clamp-2">
            {name}
          </h3>
          
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-2">
            <Badge variant="secondary" className="font-medium">
              {questionCount} {questionCount === 1 ? 'questão' : 'questões'}
            </Badge>
            
            <span className="text-xs text-muted-foreground">
              {formatDate(createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};