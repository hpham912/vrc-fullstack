import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Home, Calendar, BookOpen, Video, Bell } from 'lucide-react';
import { iosTabBarStyles as s } from './IosTabBar.styles.ts';

interface IosTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasNotifications?: boolean;
  openAdminPortal?: () => void;
  openLoginModal?: () => void;
  // Ref to the <nav> so the app can measure the tab bar's real height
  // (it varies by device safe area and font size) for the notifications
  // panel, which ends exactly above the tab bar instead of covering it.
  navRef?: React.Ref<HTMLElement>;
}

export const IosTabBar: React.FC<IosTabBarProps> = ({
  activeTab,
  setActiveTab,
  hasNotifications = false,
  navRef,
}) => {
  const { t } = useLanguage();

  // Exactly 5 mobile bottom tabs: Home, Events, Scripture, Sermons,
  // Notifications. Notifications is a real tab page on mobile
  // (NotificationsSection), so the bell navigates like any other tab.
  // Tapping it while already on Notifications stays there — it never
  // toggles closed. On desktop the notifications stay a popup opened
  // from the header bell.
  const tabs = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
    { id: 'sermons', label: t('navSermons'), icon: Video },
    { id: 'notifications', label: t('navNotifications'), icon: Bell },
  ];

  return (
    <nav ref={navRef} className={`${s.nav} z-40`}>
      <div className={s.grid}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isNotifTab = tab.id === 'notifications';
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
