import { 
  BookOpen, 
  ClipboardList, 
  Layers, 
  BarChart3, 
  Clock, 
  Shuffle,
  FolderOpen,
  Target
} from 'lucide-react';

const features = [
  {
    icon: FolderOpen,
    title: 'Banco de Questões Organizado',
    description: 'Organize suas questões por matéria, assunto e banca. Estrutura hierárquica de pastas para facilitar seus estudos.',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: ClipboardList,
    title: 'Simulados Personalizados',
    description: 'Crie simulados com questões aleatórias das matérias que você escolher. Timer integrado e correção detalhada.',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    icon: Layers,
    title: 'Flashcards para Revisão',
    description: 'Sistema de flashcards para memorização. Crie seus próprios cards e revise conceitos importantes.',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: BarChart3,
    title: 'Estatísticas Detalhadas',
    description: 'Acompanhe seu desempenho por matéria, visualize evolução ao longo do tempo e identifique pontos fracos.',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: Clock,
    title: 'Controle de Tempo',
    description: 'Registre seu tempo de estudo diário. Timer integrado e histórico completo de todas as suas sessões.',
    color: 'bg-teal-500/10 text-teal-500',
  },
  {
    icon: Shuffle,
    title: 'Estudo Aleatório',
    description: 'Modo de estudo com questões aleatórias de todas as matérias. Ideal para revisão geral e simulação de prova.',
    color: 'bg-pink-500/10 text-pink-500',
  },
  {
    icon: Target,
    title: 'Foco no que Importa',
    description: 'Interface limpa e objetiva. Sem distrações, apenas você e as questões que vão te aprovar.',
    color: 'bg-amber-500/10 text-amber-500',
  },
  {
    icon: BookOpen,
    title: 'Explicações Completas',
    description: 'Cada questão tem gabarito comentado. Entenda o porquê de cada resposta correta.',
    color: 'bg-indigo-500/10 text-indigo-500',
  },
];

export const Features = () => {
  return (
    <section id="recursos" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Tudo que Você Precisa para{' '}
            <span className="text-primary">Ser Aprovado</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas e intuitivas para organizar seus estudos 
            e maximizar seu tempo de preparação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
