import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { AppProvider } from './context/AppContext';
import { Dashboard } from './pages/Dashboard';
import { Goals } from './pages/Goals';
import { Journal } from './pages/Journal';
import { Insights } from './pages/Insights';
import { Profile } from './pages/Profile';
import { Navigation } from './components/Navigation';
import { SecurityLock } from './components/SecurityLock';
import { NotificationSystem } from './components/NotificationSystem';

const AppContent: React.FC = () => {
  const { isLocked } = useApp();
  const [view, setView] = useState('dashboard');

  if (isLocked) {
      return <SecurityLock />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard setView={setView} />;
      case 'goals':
        return <Goals />;
      case 'journal':
        return <Journal />;
      case 'insights':
        return <Insights />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 max-w-lg mx-auto bg-slate-50 dark:bg-slate-950 shadow-2xl overflow-hidden relative transition-colors duration-500">
      <NotificationSystem />
      <div className="h-full overflow-y-auto pt-safe-content px-6 pb-32">
        {renderView()}
      </div>
      <Navigation currentView={view} setView={setView} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}