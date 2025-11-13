import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import authIllustration from '@/assets/auth-illustration.png';

const authSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa'),
});

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { toast } = useToast();

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

      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
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
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Credenciais inválidas',
              description: 'Email ou senha incorretos.',
              variant: 'destructive',
            });
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro na autenticação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && event === 'SIGNED_IN') {
          onAuthSuccess();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-3">Welcome back!</h1>
            <p className="text-muted-foreground">
              Simplify your workflow and boost your productivity<br />
              with <span className="font-semibold">Tuga's App</span>. Get started for free.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Input
                type="email"
                placeholder="Username"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-14 rounded-full px-6 text-base border-2"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
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

            <div className="text-right">
              <button
                type="button"
                className="text-sm font-medium hover:underline"
                onClick={() => toast({ title: 'Funcionalidade em breve!' })}
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-full text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
            >
              {isLoading ? 'Carregando...' : 'Login'}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
                onClick={() => toast({ title: 'Google login em breve!' })}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>

              <button
                type="button"
                className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
                onClick={() => toast({ title: 'Apple login em breve!' })}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>

              <button
                type="button"
                className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
                onClick={() => toast({ title: 'Facebook login em breve!' })}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <span className="text-muted-foreground">Not a member? </span>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-primary hover:underline"
            >
              {isSignUp ? 'Login now' : 'Register now'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-subject-green/20 via-subject-green/10 to-background items-center justify-center p-16 relative overflow-hidden">
        <div className="max-w-2xl text-center space-y-8">
          <img 
            src={authIllustration} 
            alt="Productivity illustration" 
            className="w-full max-w-lg mx-auto"
          />
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">
              Make your work easier and organized<br />
              with <span className="font-bold">Tuga's App</span>
            </h2>
          </div>

          <div className="flex justify-center gap-2 pt-4">
            <div className="w-2 h-2 rounded-full bg-muted"></div>
            <div className="w-2 h-2 rounded-full bg-muted"></div>
            <div className="w-2 h-2 rounded-full bg-foreground"></div>
          </div>
        </div>
      </div>
    </div>
  );
};