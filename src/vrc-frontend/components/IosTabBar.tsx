import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Home, Calendar, BookOpen, Flame } from 'lucide-react';

interface IosTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdminPortal?: () => void;
  openLoginModal?: () => void;
}

export const IosTabBar: React.FC<IosTabBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { t } = useLanguage();

  // Exactly 4 mobile bottom tabs: Home, Events, Scripture, Youth
  const tabs = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
    { id: 'youth', label: t('navYouth'), icon: Flame },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-2xl border-t border-stone-200/80 px-3 py-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg transition-all">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-amber-800 font-bold'
                  : 'text-stone-400 hover:text-stone-700 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-amber-100/90 text-amber-900 shadow-2xs scale-105' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10.5px] mt-0.5 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[76px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
