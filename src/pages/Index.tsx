import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthPage } from '@/components/AuthPage';
import { Dashboard } from '@/components/Dashboard';
import { QuestionsPage } from '@/pages/QuestionsPage';
import { RandomStudyPage } from '@/pages/RandomStudyPage';
import { FlashcardsPage } from '@/pages/FlashcardsPage';
import { TimeclockPage } from '@/pages/TimeclockPage';
import { FolderPage } from '@/pages/FolderPage';
import { SimuladoConfigPage } from '@/pages/SimuladoConfigPage';
import { SimuladoPage, type SimuladoResult } from '@/pages/SimuladoPage';
import { SimuladoResultPage } from '@/pages/SimuladoResultPage';
import { Sidebar } from '@/components/Sidebar';
import type { User, Session } from '@supabase/supabase-js';

import { StatisticsPage } from '@/pages/StatisticsPage';

type ViewState = 'dashboard' | 'folder' | 'questions' | 'random-study' | 'flashcards' | 'timeclock' | 'statistics' | 'simulado-config' | 'simulado' | 'simulado-result';

interface SelectedSubject {
  folderId: string;
  folderName: string;
  questionCount: number;
  availableCount: number;
}

interface AppState {
  view: ViewState;
  selectedFolderId?: string;
  selectedFolderName?: string;
  // For breadcrumb navigation
  parentFolderId?: string;
  parentFolderName?: string;
  // For simulado
  simuladoSubjects?: SelectedSubject[];
  simuladoResult?: SimuladoResult;
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

  // When clicking a top-level folder from dashboard, go to folder view
  const handleFolderClick = (folderId: string, folderName: string) => {
    setAppState({
      view: 'folder',
      selectedFolderId: folderId,
      selectedFolderName: folderName,
    });
  };

  // When clicking a subfolder, go to questions view
  const handleSubfolderClick = (folderId: string, folderName: string) => {
    setAppState(prev => ({
      view: 'questions',
      selectedFolderId: folderId,
      selectedFolderName: folderName,
      parentFolderId: prev.selectedFolderId,
      parentFolderName: prev.selectedFolderName,
    }));
  };

  // View questions for a folder directly
  const handleViewQuestions = (folderId: string, folderName: string) => {
    setAppState(prev => ({
      view: 'questions',
      selectedFolderId: folderId,
      selectedFolderName: folderName,
      parentFolderId: prev.view === 'folder' ? undefined : prev.parentFolderId,
      parentFolderName: prev.view === 'folder' ? undefined : prev.parentFolderName,
    }));
  };

  const handleBackToDashboard = () => {
    setAppState({ view: 'dashboard' });
  };

  const handleBackToFolder = () => {
    if (appState.parentFolderId && appState.parentFolderName) {
      setAppState({
        view: 'folder',
        selectedFolderId: appState.parentFolderId,
        selectedFolderName: appState.parentFolderName,
      });
    } else if (appState.view === 'questions') {
      // If coming from folder questions directly (not subfolder), go back to folder
      setAppState(prev => ({
        view: 'folder',
        selectedFolderId: prev.selectedFolderId,
        selectedFolderName: prev.selectedFolderName,
      }));
    } else {
      handleBackToDashboard();
    }
  };

  const handleNavigate = (view: 'dashboard' | 'random-study' | 'flashcards' | 'timeclock' | 'statistics' | 'simulado-config') => {
    setAppState({ view });
  };

  const handleStartSimulado = (subjects: SelectedSubject[]) => {
    setAppState({ view: 'simulado', simuladoSubjects: subjects });
  };

  const handleFinishSimulado = (result: SimuladoResult) => {
    setAppState({ view: 'simulado-result', simuladoResult: result });
  };

  const handleNewSimulado = () => {
    setAppState({ view: 'simulado-config' });
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

  const getSidebarView = () => {
    if (appState.view === 'questions' || appState.view === 'folder') {
      return 'dashboard';
    }
    if (appState.view === 'simulado' || appState.view === 'simulado-result') {
      return 'simulado-config';
    }
    return appState.view;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        currentView={getSidebarView()}
        onNavigate={handleNavigate}
      />
      
      <div className="flex-1 overflow-auto lg:ml-64">
        {appState.view === 'folder' && appState.selectedFolderId && appState.selectedFolderName ? (
          <FolderPage
            folderId={appState.selectedFolderId}
            folderName={appState.selectedFolderName}
            onBack={handleBackToDashboard}
            onSubfolderClick={handleSubfolderClick}
            onViewQuestions={handleViewQuestions}
          />
        ) : appState.view === 'questions' && appState.selectedFolderId && appState.selectedFolderName ? (
          <QuestionsPage
            folderId={appState.selectedFolderId}
            folderName={appState.selectedFolderName}
            onBack={appState.parentFolderId ? handleBackToFolder : handleBackToDashboard}
            parentFolderName={appState.parentFolderName}
          />
        ) : appState.view === 'random-study' ? (
          <RandomStudyPage onBack={handleBackToDashboard} />
        ) : appState.view === 'flashcards' ? (
          <FlashcardsPage onBack={handleBackToDashboard} />
        ) : appState.view === 'timeclock' ? (
          <TimeclockPage onBack={handleBackToDashboard} />
        ) : appState.view === 'statistics' ? (
          <StatisticsPage onBack={handleBackToDashboard} />
        ) : appState.view === 'simulado-config' ? (
          <SimuladoConfigPage
            onBack={handleBackToDashboard}
            onStartSimulado={handleStartSimulado}
          />
        ) : appState.view === 'simulado' && appState.simuladoSubjects ? (
          <SimuladoPage
            subjects={appState.simuladoSubjects}
            onFinish={handleFinishSimulado}
            onCancel={handleNewSimulado}
          />
        ) : appState.view === 'simulado-result' && appState.simuladoResult ? (
          <SimuladoResultPage
            result={appState.simuladoResult}
            onNewSimulado={handleNewSimulado}
            onBack={handleBackToDashboard}
          />
        ) : (
          <Dashboard
            user={user}
            onSignOut={handleSignOut}
            onFolderClick={handleFolderClick}
            onRandomStudy={() => handleNavigate('random-study')}
            onNavigate={handleNavigate}
            currentView={getSidebarView()}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
