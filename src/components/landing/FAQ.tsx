import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Como funciona o período de teste grátis?',
    answer: 'Você tem 7 dias para experimentar todas as funcionalidades da plataforma gratuitamente. Não pedimos cartão de crédito para começar. Após o período de teste, você pode escolher um dos nossos planos.',
  },
  {
    question: 'Posso cancelar minha assinatura a qualquer momento?',
    answer: 'Sim! Você pode cancelar sua assinatura quando quiser, sem taxas ou multas. O acesso continua até o final do período já pago.',
  },
  {
    question: 'Como adiciono minhas próprias questões?',
    answer: 'É muito simples! Crie pastas para organizar por matéria/assunto, clique em "Adicionar Questão" e preencha o enunciado, alternativas, gabarito e explicação. Suas questões ficam salvas na nuvem.',
  },
  {
    question: 'Os simulados são cronometrados?',
    answer: 'Sim! Nossos simulados têm timer integrado que você pode configurar. Você também pode pausar e continuar depois. Ao final, recebe correção detalhada com estatísticas por matéria.',
  },
  {
    question: 'Consigo acessar pelo celular?',
    answer: 'Sim! Nossa plataforma é totalmente responsiva e funciona perfeitamente em smartphones e tablets. Estude de qualquer lugar, a qualquer momento.',
  },
  {
    question: 'Meus dados ficam salvos?',
    answer: 'Absolutamente! Todas as suas questões, flashcards, estatísticas e progresso ficam salvos na nuvem. Você pode acessar de qualquer dispositivo e nunca perde seu histórico.',
  },
  {
    question: 'Vocês oferecem questões prontas?',
    answer: 'Atualmente a plataforma é focada em você criar e organizar suas próprias questões. Isso garante que você estude exatamente o que precisa para o seu concurso específico.',
  },
  {
    question: 'Como funciona o suporte?',
    answer: 'Oferecemos suporte por email para todos os planos. Planos Profissional e Premium têm prioridade no atendimento. O plano Premium inclui suporte VIP 24/7.',
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Perguntas{' '}
            <span className="text-primary">Frequentes</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Tire suas dúvidas sobre a plataforma
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card rounded-xl border border-border px-6"
            >
              <AccordionTrigger className="text-left font-medium py-6 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
