import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthPage } from '@/components/AuthPage';
import { Dashboard } from '@/components/Dashboard';
import { QuestionsPage } from '@/pages/QuestionsPage';
import type { User, Session } from '@supabase/supabase-js';

type ViewState = 'dashboard' | 'questions';

interface AppState {
  view: ViewState;
  selectedFolderId?: string;
  selectedFolderName?: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>({
    view: 'dashboard',
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    setAppState({ view: 'dashboard' });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAppState({ view: 'dashboard' });
  };

  const handleFolderClick = (folderId: string, folderName: string) => {
    setAppState({
      view: 'questions',
      selectedFolderId: folderId,
      selectedFolderName: folderName,
    });
  };

  const handleBackToDashboard = () => {
    setAppState({ view: 'dashboard' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (appState.view === 'questions' && appState.selectedFolderId && appState.selectedFolderName) {
    return (
      <QuestionsPage
        folderId={appState.selectedFolderId}
        folderName={appState.selectedFolderName}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      onSignOut={handleSignOut}
      onFolderClick={handleFolderClick}
    />
  );
};

export default Index;
