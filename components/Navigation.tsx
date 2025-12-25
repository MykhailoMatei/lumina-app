import React from 'react';
import { Home, Target, Book, BarChart2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navigation: React.FC<{ currentView: string; setView: (v: string) => void }> = ({ currentView, setView }) => {
  const { themeClasses, t } = useApp();
  
  const items = [
    { id: 'dashboard', label: t('home'), icon: Home },
    { id: 'goals', label: t('goals'), icon: Target },
    { id: 'journal', label: t('journal'), icon: Book },
    { id: 'insights', label: t('insights'), icon: BarChart2 }
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 pb-safe pt-3 px-4 z-40 transition-colors">
      <div className="flex justify-around items-center max-w-lg mx-auto pb-5 px-1">
        {items.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? themeClasses.text : 'text-slate-300 dark:text-slate-600'}`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? `${themeClasses.secondary} scale-110 shadow-sm` : ''}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};