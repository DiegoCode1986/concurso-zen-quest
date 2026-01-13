import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

const plans = [
  {
    name: 'Básico',
    price: '29',
    description: 'Para quem está começando',
    features: [
      { text: 'Até 500 questões', included: true },
      { text: '5 simulados por mês', included: true },
      { text: 'Flashcards ilimitados', included: true },
      { text: 'Estatísticas básicas', included: true },
      { text: 'Estatísticas avançadas', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
    popular: false,
  },
  {
    name: 'Profissional',
    price: '49',
    description: 'O mais escolhido pelos aprovados',
    features: [
      { text: 'Questões ilimitadas', included: true },
      { text: 'Simulados ilimitados', included: true },
      { text: 'Flashcards ilimitados', included: true },
      { text: 'Estatísticas completas', included: true },
      { text: 'Suporte por email', included: true },
      { text: 'Mentoria individual', included: false },
    ],
    popular: true,
  },
  {
    name: 'Premium',
    price: '79',
    description: 'Para quem quer o máximo',
    features: [
      { text: 'Questões ilimitadas', included: true },
      { text: 'Simulados ilimitados', included: true },
      { text: 'Flashcards ilimitados', included: true },
      { text: 'Estatísticas completas', included: true },
      { text: 'Suporte VIP 24/7', included: true },
      { text: 'Mentoria individual', included: true },
    ],
    popular: false,
  },
];

export const Pricing = () => {
  return (
    <section id="precos" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Planos que Cabem no{' '}
            <span className="text-primary">Seu Bolso</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para sua jornada de estudos. 
            Todos incluem 7 dias grátis para você experimentar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card rounded-2xl p-8 border-2 transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary shadow-xl scale-105' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="font-semibold text-xl mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-muted-foreground">R$</span>
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/cadastro">
                <Button 
                  className={`w-full h-12 ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-foreground hover:bg-foreground/90'
                  }`}
                >
                  Começar 7 Dias Grátis
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8">
          Sem compromisso. Cancele quando quiser.
        </p>
      </div>
    </section>
  );
};
