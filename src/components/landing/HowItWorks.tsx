import { UserPlus, FolderPlus, Trophy } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Crie sua Conta',
    description: 'Cadastre-se gratuitamente e tenha acesso imediato à plataforma. Em menos de 1 minuto você está pronto.',
  },
  {
    number: '02',
    icon: FolderPlus,
    title: 'Organize suas Questões',
    description: 'Crie pastas por matéria e assunto. Adicione suas questões com gabarito e comentários explicativos.',
  },
  {
    number: '03',
    icon: Trophy,
    title: 'Estude e Seja Aprovado',
    description: 'Use simulados, flashcards e estatísticas para potencializar seus estudos. Acompanhe sua evolução e conquiste sua vaga!',
  },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simples de Usar,{' '}
            <span className="text-primary">Poderoso nos Resultados</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Em 3 passos simples você começa a estudar de forma mais eficiente.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-card rounded-2xl p-8 border border-border text-center relative z-10">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 mt-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
