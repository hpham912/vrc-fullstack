import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Calendar, BookOpen, Clock, ShieldCheck, LogIn } from 'lucide-react';

interface IosTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdminPortal: () => void;
  openLoginModal: () => void;
}

export const IosTabBar: React.FC<IosTabBarProps> = ({
  activeTab,
  setActiveTab,
  openAdminPortal,
  openLoginModal,
}) => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const tabs = [
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
    { id: 'about', label: t('navAbout'), icon: Clock },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-2xl border-t border-stone-200/80 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg transition-all">
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
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-amber-100/80 text-amber-900 shadow-2xs' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[70px]">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* 4th Tab: Admin */}
        <button
          onClick={isAdmin ? openAdminPortal : openLoginModal}
          className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 active:scale-90 ${
            isAdmin ? 'text-amber-800 font-bold' : 'text-stone-400 hover:text-stone-700 font-medium'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              isAdmin ? 'bg-amber-100/80 text-amber-900 shadow-2xs' : ''
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-5 h-5 stroke-[2.4] text-amber-800" />
            ) : (
              <LogIn className="w-5 h-5 stroke-[1.8]" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[70px]">
            {isAdmin ? t('navAdmin') : t('navLogin')}
          </span>
        </button>
      </div>
    </nav>
  );
};
