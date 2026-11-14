import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getChurchLogoSrc } from '../../constants/assets.ts';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  Bell,
  X,
  Settings,
  Moon,
  Sun,
  Type,
  Palette,
} from 'lucide-react';
import { NotificationModal } from '../notification-modal/NotificationModal.tsx';
import { SegmentedControl, NotificationBadge } from '../../common-component/index.ts';
import { AppNotification } from '../../types/index.ts';
import { navbarStyles as s } from './Navbar.styles.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdminPortal?: () => void;
  openLoginModal: () => void;
  notifications: AppNotification[];
  // Number of unread notifications (0 = no badge). The bell shows the
  // count; opening the notifications popup clears it.
  notificationCount?: number;
  onRequestNotificationPermission: () => void;
  onOpenNotifications?: () => void;
  isNotifOpen?: boolean;
  // Ref to the bell button, handed up so the desktop notifications
  // popup can anchor directly below it.
  notifButtonRef?: React.Ref<HTMLButtonElement>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAdminPortal,
  openLoginModal,
  notifications,
  notificationCount = 0,
  onRequestNotificationPermission,
  onOpenNotifications,
  isNotifOpen,
  notifButtonRef,
}) => {
  const { isAdmin, logout } = useAuth();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSettings) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showSettings]);

  const [isLargeFont, setIsLargeFont] = useState(() => {
    try {
      const enabled = localStorage.getItem('vrc_large_font') === '1';
      if (enabled) {
        document.documentElement.classList.add('large-font');
        document.documentElement.style.fontSize = '22px';
      }
      return enabled;
    } catch {
      return false;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('vrc_theme');
      if (saved) {
        const dark = saved === 'dark';
        document.documentElement.classList.toggle('dark', dark);
        return dark;
      }
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Color theme: Default Blue & Gold (theme-bluegold) vs Legacy Black & Gold (theme-blackgold).
  // Both themes have dedicated CSS files in src/styles/ (imported by index.css).
  const [isLegacyTheme, setIsLegacyTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('vrc_color_theme');
      return stored === 'blackgold' || document.documentElement.classList.contains('theme-blackgold');
    } catch {
      return false;
    }
  });

  return (
    <header className={s.header}>
      <div className={s.container}>
        <div className={s.innerRow}>
          {/* Logo: horizontal lockup with the church name built in */}
          <button
            onClick={() => setActiveTab('home')}
            className={s.logoBtn}
          >
            {language === 'vi' ? (
              <>
                <img
                  src={getChurchLogoSrc('vi', 'light')}
                  alt="Vietnamese Revival Baptist Church"
                  className={`${s.logoImg} dark:hidden`}
                />
                <img
                  src={getChurchLogoSrc('vi', 'dark')}
                  alt="Vietnamese Revival Baptist Church"
                  className={`${s.logoImg} hidden dark:block`}
                />
              </>
            ) : (
              <>
                <img
                  src={getChurchLogoSrc('en', 'light')}
                  alt="Vietnamese Revival Baptist Church"
                  className={`${s.logoImg} dark:hidden`}
                />
                <img
                  src={getChurchLogoSrc('en', 'dark')}
                  alt="Vietnamese Revival Baptist Church"
                  className={`${s.logoImg} hidden dark:block`}
                />
              </>
            )}
          </button>

          {/* Right Header Controls: Notification, Language Toggle, Settings */}
          <div className={s.rightControls}>
            {/* Notification Bell Button (Desktop View) */}
            <button
              ref={notifButtonRef}
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  setShowNotifModal((prev) => !prev);
                  if (!showNotifModal) {
                    onRequestNotificationPermission();
                  }
                }
              }}
              className={`${s.notifBtnBase} ${
                (isNotifOpen !== undefined ? isNotifOpen : showNotifModal)
                  ? s.notifBtnActive
                  : s.notifBtnInactive
              }`}
              title="Notifications"
              aria-label="Toggle notifications"
            >
              <Bell className="w-4 h-4" />
              <NotificationBadge count={notificationCount} className="absolute top-1 right-1" />
            </button>

            {/* Notification Modal (rendered if not handled by root app) */}
            {!onOpenNotifications && (
              <NotificationModal
                isOpen={showNotifModal}
                onClose={() => setShowNotifModal(false)}
                notifications={notifications}
                onRequestPermission={onRequestNotificationPermission}
                onSelectNotification={(notif) => {
                  setShowNotifModal(false);
                  if (notif.type === 'event') setActiveTab('events');
                  else if (notif.type === 'verse') setActiveTab('verse');
                }}
              />
            )}

            {/* Language Switcher: Mobile Compact Toggle */}
            <button
              onClick={toggleLanguage}
              className={s.mobileLangBtn}
              title="Switch language"
            >
              <span className={s.mobileLangText}>{language === 'vi' ? 'EN' : 'VI'}</span>
            </button>

            {/* Language Switcher: Desktop Pill (hidden on mobile, where
                the compact VI/EN button above is used instead) */}
            <div className="hidden sm:block">
              <SegmentedControl
                options={[
                  { value: 'vi', label: 'VI' },
                  { value: 'en', label: 'EN' },
                ]}
                value={language}
                onChange={setLanguage}
                ariaLabel="Language"
              />
            </div>

            {/* Settings Dropdown (Font Size + Login/Logout) */}
            <div className={s.settingsWrapper} ref={settingsRef}>
              <button
                onClick={() => setShowSettings((prev) => !prev)}
                className={`${s.settingsBtnBase} ${
                  showSettings ? s.settingsBtnActive : s.settingsBtnInactive
                }`}
                title={t('navSettings')}
                aria-label="Settings"
                aria-expanded={showSettings}
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettings && (
                <>
                  <div
                    className={s.settingsBackdrop}
                    onClick={() => setShowSettings(false)}
                    onTouchStart={() => setShowSettings(false)}
                    aria-hidden="true"
                  />
                  <div className={s.settingsMenu}>
                    {/* Dark Mode Toggle */}
                    <button
                      onClick={() => {
                        const next = !isDarkMode;
                        setIsDarkMode(next);
                        document.documentElement.classList.toggle('dark', next);
                        try {
                          localStorage.setItem('vrc_theme', next ? 'dark' : 'light');
                        } catch {}
                        setShowSettings(false);
                      }}
                      className={s.settingsToggleItem}
                      role="switch"
                      aria-checked={isDarkMode}
                    >
                      <div className={s.settingsItemLeft}>
                        {isDarkMode ? (
                          <Moon className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 flex-shrink-0" />
                        ) : (
                          <Sun className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        )}
                        <span>{t('navDarkMode')}</span>
                      </div>
                      <span
                        className={`${s.settingsFontBadgeBase} ${
                          isDarkMode ? s.settingsFontBadgeOn : s.settingsFontBadgeOff
                        }`}
                      >
                        {isDarkMode ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Font Size Toggle */}
                    <button
                      onClick={() => {
                        const next = !isLargeFont;
                        setIsLargeFont(next);
                        document.documentElement.classList.toggle('large-font', next);
                        document.documentElement.style.fontSize = next ? '22px' : '';
                        try {
                          localStorage.setItem('vrc_large_font', next ? '1' : '0');
                        } catch {}
                      }}
                      className={s.settingsToggleItem}
                      role="switch"
                      aria-checked={isLargeFont}
                    >
                      <div className={s.settingsItemLeft}>
                        <Type className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300 flex-shrink-0" />
                        <span>{t('navLargerText')}</span>
                      </div>
                      <span
                        className={`${s.settingsFontBadgeBase} ${
                          isLargeFont ? s.settingsFontBadgeOn : s.settingsFontBadgeOff
                        }`}
                      >
                        {isLargeFont ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Legacy Black & Gold vs Default Blue & Gold Theme Toggle */}
                    <button
                      onClick={() => {
                        const next = !isLegacyTheme;
                        setIsLegacyTheme(next);
                        document.documentElement.classList.toggle('theme-blackgold', next);
                        document.documentElement.classList.toggle('theme-bluegold', !next);
                        try {
                          localStorage.setItem('vrc_color_theme', next ? 'blackgold' : 'bluegold');
                        } catch {}
                      }}
                      className={s.settingsToggleItem}
                      role="switch"
                      aria-checked={isLegacyTheme}
                    >
                      <div className={s.settingsItemLeft}>
                        <Palette className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300 flex-shrink-0" />
                        <span>{t('navLegacyTheme')}</span>
                      </div>
                      <span
                        className={`${s.settingsFontBadgeBase} ${
                          isLegacyTheme ? s.settingsFontBadgeOn : s.settingsFontBadgeOff
                        }`}
                      >
                        {isLegacyTheme ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <div className={s.settingsDivider} />

                    {isAdmin ? (
                      <>
                        {openAdminPortal && (
                          <button
                            onClick={() => {
                              setShowSettings(false);
                              openAdminPortal();
                            }}
                            className={s.settingsAdminItem}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>{t('navAdmin')}</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowSettings(false);
                            logout();
                          }}
                          className={s.settingsLogoutItem}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t('navLogout')}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          openLoginModal();
                        }}
                        className={s.settingsLoginItem}
                      >
                        <LogIn className="w-3.5 h-3.5 text-amber-700" />
                        <span>{t('navLogin')}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
