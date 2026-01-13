import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">Q</span>
            </div>
            <span className="font-bold text-xl">Questões</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('recursos')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Recursos
            </button>
            <button
              onClick={() => scrollToSection('como-funciona')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Como Funciona
            </button>
            <button
              onClick={() => scrollToSection('precos')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Preços
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </button>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button className="bg-primary hover:bg-primary/90">Começar Grátis</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('recursos')}
                className="text-left px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Recursos
              </button>
              <button
                onClick={() => scrollToSection('como-funciona')}
                className="text-left px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Como Funciona
              </button>
              <button
                onClick={() => scrollToSection('precos')}
                className="text-left px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Preços
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-left px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </button>
              <div className="flex flex-col gap-2 px-4 pt-4 border-t border-border">
                <Link to="/login">
                  <Button variant="outline" className="w-full">Entrar</Button>
                </Link>
                <Link to="/cadastro">
                  <Button className="w-full bg-primary hover:bg-primary/90">Começar Grátis</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
