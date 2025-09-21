import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/ToastContainer';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { EvaluationPage } from './components/EvaluationPage';
import type { AvaliacaoData } from './types';

type AppScreen = 'dashboard' | 'evaluation';

interface EvaluationState {
  grupo: AvaliacaoData;
  sheetName: string;
}
function AppContent() {
  const { isAuthenticated } = useAuth();
  const { toasts, removeToast, toast } = useToast();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [evaluationState, setEvaluationState] = useState<EvaluationState | null>(null);

  const handleNavigateToEvaluation = (grupo: AvaliacaoData, sheetName: string) => {
    setEvaluationState({ grupo, sheetName });
    setCurrentScreen('evaluation');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
    setEvaluationState(null);
  };

  if (!isAuthenticated) {
    return <LoginPage onToast={toast.error} />;
  }

  return (
    <>
      {currentScreen === 'dashboard' && (
        <Dashboard 
          onToast={(message, type) => {
            if (type === 'success') toast.success(message);
            else if (type === 'error') toast.error(message);
            else toast.warning(message);
          }}
          onNavigateToEvaluation={handleNavigateToEvaluation}
        />
      )}
      
      {currentScreen === 'evaluation' && evaluationState && (
        <EvaluationPage
          grupo={evaluationState.grupo}
          sheetName={evaluationState.sheetName}
          onBack={handleBackToDashboard}
          onToast={(message, type) => {
            if (type === 'success') toast.success(message);
            else if (type === 'error') toast.error(message);
            else toast.warning(message);
          }}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;