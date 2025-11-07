import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthPage } from '@/components/AuthPage';
import { Dashboard } from '@/components/Dashboard';
import { QuestionsPage } from '@/pages/QuestionsPage';
import { RandomStudyPage } from '@/pages/RandomStudyPage';
import { FlashcardsPage } from '@/pages/FlashcardsPage';
import { TimeclockPage } from '@/pages/TimeclockPage';
import { Sidebar } from '@/components/Sidebar';
import type { User, Session } from '@supabase/supabase-js';

type ViewState = 'dashboard' | 'questions' | 'random-study' | 'flashcards' | 'timeclock';

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

  const handleNavigate = (view: 'dashboard' | 'random-study' | 'flashcards' | 'timeclock') => {
    setAppState({ view });
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        currentView={appState.view === 'questions' ? 'dashboard' : appState.view}
        onNavigate={handleNavigate}
      />
      
      <div className="flex-1 overflow-auto lg:ml-64">
        {appState.view === 'questions' && appState.selectedFolderId && appState.selectedFolderName ? (
          <QuestionsPage
            folderId={appState.selectedFolderId}
            folderName={appState.selectedFolderName}
            onBack={handleBackToDashboard}
          />
        ) : appState.view === 'random-study' ? (
          <RandomStudyPage onBack={handleBackToDashboard} />
        ) : appState.view === 'flashcards' ? (
          <FlashcardsPage onBack={handleBackToDashboard} />
        ) : appState.view === 'timeclock' ? (
          <TimeclockPage onBack={handleBackToDashboard} />
        ) : (
          <Dashboard
            user={user}
            onSignOut={handleSignOut}
            onFolderClick={handleFolderClick}
            onRandomStudy={() => handleNavigate('random-study')}
            onNavigate={handleNavigate}
            currentView={appState.view === 'questions' ? 'dashboard' : appState.view}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
