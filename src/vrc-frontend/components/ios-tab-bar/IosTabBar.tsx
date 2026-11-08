import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Home, Calendar, BookOpen, Bell } from 'lucide-react';
import { iosTabBarStyles as s } from './IosTabBar.styles.ts';

interface IosTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNotifications: () => void;
  hasNotifications?: boolean;
  isNotifOpen?: boolean;
  openAdminPortal?: () => void;
  openLoginModal?: () => void;
}

export const IosTabBar: React.FC<IosTabBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
  hasNotifications = false,
  isNotifOpen = false,
}) => {
  const { t } = useLanguage();

  // Exactly 4 mobile bottom tabs: Home, Events, Scripture, Notifications
  const tabs = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
    { id: 'notifications', label: t('navNotifications'), icon: Bell },
  ];

  return (
    <nav className={`${s.nav} ${isNotifOpen ? 'z-[110]' : 'z-40'}`}>
      <div className={s.grid}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isNotifTab = tab.id === 'notifications';
          const isActive = isNotifTab ? isNotifOpen : (activeTab === tab.id && !isNotifOpen);
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isNotifTab) {
                  onOpenNotifications();
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`${s.tabBtnBase} ${isActive ? s.tabBtnActive : s.tabBtnInactive}`}
              aria-label={tab.label}
            >
              <div className={`${s.iconBoxBase} ${isActive ? s.iconBoxActive : ''} relative`}>
                <Icon className={`${s.iconBase} ${isActive ? s.iconActive : s.iconInactive}`} />
                {isNotifTab && hasNotifications && (
                  <span className={s.notifDot} />
                )}
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
