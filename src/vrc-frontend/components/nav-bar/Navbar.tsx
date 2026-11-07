import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CHURCH_NAME } from '../../constants/church.ts';
import { CrossIcon } from '../cross-icon/CrossIcon.tsx';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  Bell,
  X,
  Settings,
  HeartHandshake,
} from 'lucide-react';
import { NotificationModal } from '../notification-modal/NotificationModal.tsx';
import { AppNotification } from '../../types/index.ts';
import { navbarStyles as s } from './Navbar.styles.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdminPortal?: () => void;
  openLoginModal: () => void;
  notifications: AppNotification[];
  onRequestNotificationPermission: () => void;
  onOpenPrayerModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAdminPortal,
  openLoginModal,
  notifications,
  onRequestNotificationPermission,
  onOpenPrayerModal,
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
        document.documentElement.style.fontSize = '18.5px';
      }
      return enabled;
    } catch {
      return false;
    }
  });

  return (
    <header className={s.header}>
      <div className={s.container}>
        <div className={s.innerRow}>
          {/* Logo & Title with SVG Cross */}
          <button
            onClick={() => setActiveTab('home')}
            className={s.logoBtn}
          >
            <div className={s.logoIconBox}>
              <CrossIcon className={s.logoCrossIcon} />
            </div>

            {/* Mobile View: VRBC on top, HTTLBPH on bottom */}
            <div className={s.mobileTitleCol}>
              <span className={s.mobileTitleEn}>
                {CHURCH_NAME.shortEn}
              </span>
              <span className={s.mobileTitleVi}>
                {CHURCH_NAME.shortVi}
              </span>
            </div>

            {/* Desktop View: Full name with English on top, Vietnamese on bottom */}
            <div className={s.desktopTitleCol}>
              <span className={s.desktopTitleEn}>
                {CHURCH_NAME.en}
              </span>
              <span className={s.desktopTitleVi}>
                {CHURCH_NAME.vi}
              </span>
            </div>
          </button>

          {/* Right Header Controls: Prayer, Notification, Language Toggle, Settings */}
          <div className={s.rightControls}>
            {/* Prayer Header Action Button */}
            {onOpenPrayerModal && (
              <button
                onClick={onOpenPrayerModal}
                className={s.prayerBtn}
                title={t('navPrayerTitle')}
              >
                <HeartHandshake className={s.prayerIcon} />
                <span className={s.prayerText}>
                  {t('navPrayer')}
                </span>
              </button>
            )}

            {/* Notification Bell Button */}
            <button
              onClick={() => {
                setShowNotifModal((prev) => !prev);
                if (!showNotifModal) {
                  onRequestNotificationPermission();
                }
              }}
              className={`${s.notifBtnBase} ${
                showNotifModal ? s.notifBtnActive : s.notifBtnInactive
              }`}
              title="Notifications"
              aria-label="Toggle notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className={s.notifDot} />
              )}
            </button>

            {/* Notification Modal Covering Whole Page */}
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

            {/* Language Switcher: Mobile Compact Toggle */}
            <button
              onClick={toggleLanguage}
              className={s.mobileLangBtn}
              title="Switch language"
            >
              <span className={s.mobileLangText}>{language === 'vi' ? 'VI' : 'EN'}</span>
            </button>

            {/* Language Switcher: Desktop Pill */}
            <div className={s.desktopLangGroup}>
              <button
                onClick={() => setLanguage('vi')}
                className={`${s.desktopLangBtnBase} ${
                  language === 'vi' ? s.desktopLangBtnActive : s.desktopLangBtnInactive
                }`}
                title="Tiếng Việt"
              >
                <span>VI</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`${s.desktopLangBtnBase} ${
                  language === 'en' ? s.desktopLangBtnActive : s.desktopLangBtnInactive
                }`}
                title="English"
              >
                <span>EN</span>
              </button>
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
                    <button
                      onClick={() => {
                        const next = !isLargeFont;
                        setIsLargeFont(next);
                        document.documentElement.classList.toggle('large-font', next);
                        document.documentElement.style.fontSize = next ? '18.5px' : '';
                        try {
                          localStorage.setItem('vrc_large_font', next ? '1' : '0');
                        } catch {}
                        setShowSettings(false);
                      }}
                      className={s.settingsFontItem}
                    >
                      <span>{t('navLargerText')}</span>
                      <span
                        className={`${s.settingsFontBadgeBase} ${
                          isLargeFont ? s.settingsFontBadgeOn : s.settingsFontBadgeOff
                        }`}
                      >
                        {isLargeFont ? 'ON' : 'OFF'}
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
