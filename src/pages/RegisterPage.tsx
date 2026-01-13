import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import authIllustration from '@/assets/auth-illustration.png';

const authSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa'),
});

const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/app');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && event === 'SIGNED_IN') {
          navigate('/app');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = authSchema.safeParse(formData);
      if (!validation.success) {
        toast({
          title: 'Dados inválidos',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }

      const { email, password } = validation.data;

      const redirectUrl = `${window.location.origin}/app`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Email já cadastrado',
            description: 'Este email já está em uso. Tente fazer login.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Cadastro realizado!',
          description: 'Verifique seu email para confirmar o cadastro.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro no cadastro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3">Crie sua conta</h1>
            <p className="text-muted-foreground">
              Comece agora sua jornada rumo à aprovação.<br />
              <span className="font-medium text-primary">7 dias grátis</span> para experimentar!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-14 rounded-full px-6 text-base border-2"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha (mínimo 6 caracteres)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-14 rounded-full px-6 pr-12 text-base border-2"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-full text-base font-semibold bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta Grátis'}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Ao criar sua conta, você concorda com nossos{' '}
            <a href="#" className="underline">Termos de Uso</a> e{' '}
            <a href="#" className="underline">Política de Privacidade</a>.
          </p>

          <div className="mt-8 text-center">
            <span className="text-muted-foreground">Já tem conta? </span>
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Faça login
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-primary/10 to-background items-center justify-center p-16 relative overflow-hidden">
        <div className="max-w-2xl text-center space-y-8">
          <img
            src={authIllustration}
            alt="Ilustração de estudos"
            className="w-full max-w-lg mx-auto"
          />

          <div className="space-y-2">
            <h2 className="text-3xl font-bold">
              Organize seus estudos e conquiste<br />
              <span className="text-primary">sua aprovação!</span>
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
