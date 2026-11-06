import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { CHURCH_NAME } from '../constants/church.ts';
import { CrossIcon } from './CrossIcon.tsx';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  Bell,
  X,
  Settings,
  HeartHandshake,
} from 'lucide-react';
import { NotificationModal } from './NotificationModal.tsx';
import { AppNotification } from '../types/index.ts';

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-200/60 transition-all pt-safe">
      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-20">
          {/* Logo & Title with SVG Cross (never shows as iOS emoji) */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 sm:gap-3 text-left group transition-transform active:scale-95 flex-shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center font-bold shadow-xs group-hover:bg-amber-600 group-hover:text-white transition-all flex-shrink-0">
              <CrossIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            {/* Mobile View: VRBC on top, HTTLBPH on bottom */}
            <div className="flex flex-col sm:hidden">
              <span className="font-serif text-sm font-bold tracking-tight text-stone-950 leading-tight">
                {CHURCH_NAME.shortEn}
              </span>
              <span className="text-[10px] font-medium text-amber-800 tracking-normal leading-tight opacity-90">
                {CHURCH_NAME.shortVi}
              </span>
            </div>

            {/* Desktop View: Full name with English on top, Vietnamese on bottom */}
            <div className="hidden sm:flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-stone-950 leading-snug">
                {CHURCH_NAME.en}
              </span>
              <span className="text-xs font-medium text-amber-800 tracking-normal leading-tight opacity-90">
                {CHURCH_NAME.vi}
              </span>
            </div>
          </button>

          {/* Right Header Controls: Prayer, Notification, Language Toggle, Settings, and Admin */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Prayer Header Action Button - Displays "Prayer" on mobile */}
            {onOpenPrayerModal && (
              <button
                onClick={onOpenPrayerModal}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 active:scale-95 border border-amber-200/90 text-amber-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title={language === 'vi' ? 'Gửi Lời Cầu Nguyện' : 'Prayer Request'}
              >
                <HeartHandshake className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span className="tracking-tight text-xs font-bold">
                  {language === 'vi' ? 'Cầu Nguyện' : 'Prayer'}
                </span>
              </button>
            )}

            {/* Notification Bell Button (Click to Open/Close Popup) */}
            <button
              onClick={() => {
                setShowNotifModal((prev) => !prev);
                if (!showNotifModal) {
                  onRequestNotificationPermission();
                }
              }}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl active:scale-95 transition-all relative border ${
                showNotifModal
                  ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/30'
                  : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-700 border-stone-200/70'
              }`}
              title="Notifications"
              aria-label="Toggle notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white animate-pulse" />
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
              className="sm:hidden px-2 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 border border-stone-300 text-xs font-bold text-stone-900 flex items-center gap-1 shadow-2xs"
              title="Switch language"
            >
              <span className="text-[13px] font-mono font-bold">{language === 'vi' ? 'VI' : 'EN'}</span>
            </button>

            {/* Language Switcher: Desktop Pill */}
            <div className="hidden sm:flex items-center bg-stone-100 p-1 rounded-xl border border-stone-300 text-xs font-bold shadow-2xs">
              <button
                onClick={() => setLanguage('vi')}
                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] ${
                  language === 'vi'
                    ? 'bg-white text-stone-950 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-950 font-semibold'
                }`}
                title="Tiếng Việt"
              >
                <span>VI</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] ${
                  language === 'en'
                    ? 'bg-white text-stone-950 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-950 font-semibold'
                }`}
                title="English"
              >
                <span>EN</span>
              </button>
            </div>

            {/* Settings Dropdown (Font Size + Login/Logout) */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings((prev) => !prev)}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  showSettings
                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                }`}
                title={language === 'vi' ? 'Cài đặt' : 'Settings'}
                aria-label="Settings"
                aria-expanded={showSettings}
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettings && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent cursor-pointer"
                    onClick={() => setShowSettings(false)}
                    onTouchStart={() => setShowSettings(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-stone-200 shadow-xl py-1.5 z-50 text-xs">
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
                      className="w-full px-3.5 py-2.5 text-left hover:bg-stone-50 flex items-center justify-between text-stone-800 font-semibold cursor-pointer"
                    >
                      <span>{language === 'vi' ? 'Cỡ chữ lớn (A+)' : 'Larger Text (A+)'}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLargeFont
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {isLargeFont ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <div className="my-1 border-t border-stone-100" />

                    {isAdmin ? (
                      <>
                        {openAdminPortal && (
                          <button
                            onClick={() => {
                              setShowSettings(false);
                              openAdminPortal();
                            }}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-amber-50 flex items-center gap-2 text-stone-900 font-semibold cursor-pointer"
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
                          className="w-full px-3.5 py-2.5 text-left hover:bg-red-50 flex items-center gap-2 text-red-600 font-semibold cursor-pointer"
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
                        className="w-full px-3.5 py-2.5 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-800 font-semibold cursor-pointer"
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
