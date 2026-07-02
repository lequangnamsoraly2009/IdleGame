import React, { useEffect, useState } from 'react';
import { useGameStore } from './stores/gameStore';
import { AuthScreen } from './components/AuthScreen';
import { GameHUD } from './components/GameHUD';
import { DocumentsPage } from './components/DocumentsPage';
import { AdminPage } from './components/AdminPage';
import { LoadingScreen } from './components/LoadingScreen';

export const App: React.FC = () => {
  const { user, isLoading, initializeAuth } = useGameStore();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Start listening to Auth (triggers either Mock Auth check or Firebase Auth SDK check)
    const unsubscribe = initializeAuth();



    return () => unsubscribe();
  }, [initializeAuth]);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (currentPath === '/documents' || currentPath === '/documents/') {
    return <DocumentsPage onNavigate={navigate} />;
  }

  if (currentPath === '/admin' || currentPath === '/admin/') {
    return <AdminPage onNavigate={navigate} />;
  }

  return user ? <GameHUD onNavigate={navigate} /> : <AuthScreen />;
};

export default App;
