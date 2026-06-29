import React, { useEffect, useState } from 'react';
import { useGameStore } from './stores/gameStore';
import { AuthScreen } from './components/AuthScreen';
import { GameHUD } from './components/GameHUD';
import { DocumentsPage } from './components/DocumentsPage';

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
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Background glow */}
        <div className="absolute w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
        
        {/* Loading Spinner Content */}
        <div className="text-center relative z-10 space-y-6">
          <div className="inline-block p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl animate-pulse">
            <span className="text-5xl block animate-spin duration-[4s]">🛡️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-slate-300 font-display">
              SYNCHRONIZING REALM
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
              Establishing server handshakes...
            </p>
          </div>
          <div className="w-48 h-1 bg-slate-900 border border-slate-850 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-blue-600 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (currentPath === '/documents' || currentPath === '/documents/') {
    return <DocumentsPage onNavigate={navigate} />;
  }

  return user ? <GameHUD onNavigate={navigate} /> : <AuthScreen />;
};

export default App;
