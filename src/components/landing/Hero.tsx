import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Plataforma #1 para Concurseiros
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Domine as{' '}
            <span className="text-primary">Questões de Concursos</span>
            <br />
            e Conquiste sua Vaga
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plataforma completa com banco de questões organizadas, simulados personalizados, 
            flashcards e estatísticas detalhadas para maximizar seus estudos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/cadastro">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90">
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                Já tenho conta
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Acesso imediato</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>7 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>

        {/* Hero Image / Dashboard Preview */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-b from-primary/20 to-transparent absolute inset-0 -top-20 blur-3xl opacity-30" />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center text-sm text-muted-foreground">
                Área do Aluno - Questões
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-background to-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stats Cards */}
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="text-3xl font-bold text-primary">2,500+</div>
                  <div className="text-muted-foreground">Questões Resolvidas</div>
                </div>
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="text-3xl font-bold text-green-500">78%</div>
                  <div className="text-muted-foreground">Taxa de Acerto</div>
                </div>
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="text-3xl font-bold text-orange-500">156h</div>
                  <div className="text-muted-foreground">Tempo de Estudo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
