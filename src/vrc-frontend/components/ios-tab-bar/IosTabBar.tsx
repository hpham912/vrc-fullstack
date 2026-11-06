import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Home, Calendar, BookOpen, Flame } from 'lucide-react';
import { iosTabBarStyles as s } from './IosTabBar.styles.ts';

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
    <nav className={s.nav}>
      <div className={s.grid}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${s.tabBtnBase} ${isActive ? s.tabBtnActive : s.tabBtnInactive}`}
            >
              <div className={`${s.iconBoxBase} ${isActive ? s.iconBoxActive : ''}`}>
                <Icon className={`${s.iconBase} ${isActive ? s.iconActive : s.iconInactive}`} />
              </div>
              <span className={s.label}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
