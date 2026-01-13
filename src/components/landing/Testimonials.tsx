import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'Aprovada TRF-3',
    content: 'A organização das questões por assunto foi fundamental para minha aprovação. Consegui identificar meus pontos fracos e focar onde realmente precisava.',
    avatar: 'MS',
    rating: 5,
  },
  {
    name: 'João Santos',
    role: 'Aprovado INSS',
    content: 'Os simulados personalizados me ajudaram muito a ter noção do tempo durante a prova. Cheguei no dia da prova muito mais preparado e confiante.',
    avatar: 'JS',
    rating: 5,
  },
  {
    name: 'Ana Costa',
    role: 'Aprovada Banco do Brasil',
    content: 'Os flashcards me salvaram na reta final! Revisava os principais conceitos todos os dias no caminho pro trabalho. Ferramenta incrível!',
    avatar: 'AC',
    rating: 5,
  },
  {
    name: 'Pedro Oliveira',
    role: 'Aprovado Polícia Federal',
    content: 'As estatísticas me mostraram exatamente onde eu precisava melhorar. Aumentei minha taxa de acerto de 60% para 85% em 3 meses.',
    avatar: 'PO',
    rating: 5,
  },
  {
    name: 'Carla Mendes',
    role: 'Aprovada TCU',
    content: 'Interface limpa e funcional. Finalmente uma plataforma que entende o que o concurseiro precisa. Recomendo a todos!',
    avatar: 'CM',
    rating: 5,
  },
  {
    name: 'Lucas Ferreira',
    role: 'Aprovado Receita Federal',
    content: 'O controle de tempo de estudo me ajudou a manter a disciplina. Poder ver quantas horas estudei por mês me motivou muito.',
    avatar: 'LF',
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            O que Nossos{' '}
            <span className="text-primary">Aprovados</span> Dizem
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Milhares de alunos já conquistaram suas vagas estudando com a plataforma Questões.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">{testimonial.avatar}</span>
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
