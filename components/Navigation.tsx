
import React from 'react';
import { Home, Book, Target, Compass, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavigationProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const { themeClasses, dashboardLayout, t } = useApp();
  
  const navItems = [
    { id: 'dashboard', label: t('home'), icon: Home, show: true },
    { id: 'goals', label: t('goals'), icon: Target, show: true },
    { id: 'journal', label: t('journal'), icon: Book, show: true },
    { id: 'inspiration', label: t('grow'), icon: Compass, show: dashboardLayout.showGrow },
    { id: 'community', label: t('community'), icon: Users, show: dashboardLayout.showCommunity },
  ];

  const visibleItems = navItems.filter(item => item.show);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 pb-safe pt-3 px-4 z-[40] transition-colors">
      <div className={`flex justify-between items-center max-w-lg mx-auto pb-5 ${visibleItems.length < 5 ? 'px-16' : 'px-4'}`}>
        {visibleItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 ${
                isActive ? themeClasses.text : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
              }`}
            >
              <div className={`p-2.5 rounded-2xl transition-all duration-500 ${isActive ? `${themeClasses.secondary} scale-110 shadow-sm` : 'bg-transparent'}`}>
                {/* Reduced strokeWidth from 3/2 to 2.2/1.5 for a thinner look */}
                <Icon size={24} strokeWidth={isActive ? 2.2 : 1.5} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
