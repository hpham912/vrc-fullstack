import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { CHURCH_NAME } from '../constants/church.ts';
import { CrossIcon } from './CrossIcon.tsx';
import {
  Home,
  Calendar,
  BookOpen,
  Flame,
  Clock,
  ShieldCheck,
  LogIn,
  LogOut,
  Bell,
  X,
  Settings,
} from 'lucide-react';
import { NotificationModal } from './NotificationModal.tsx';
import { AppNotification } from '../types/index.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdminPortal: () => void;
  openLoginModal: () => void;
  notifications: AppNotification[];
  onRequestNotificationPermission: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAdminPortal,
  openLoginModal,
  notifications,
  onRequestNotificationPermission,
}) => {
  const { isAdmin, logout } = useAuth();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  const desktopNavItems = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
    { id: 'youth', label: t('navYouth'), icon: Flame },
    { id: 'about', label: t('navAbout'), icon: Clock },
  ];

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

          {/* Desktop Nav Pills */}
          <nav className="hidden md:flex items-center bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-75" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls: Notification, Language Toggle, Settings, and Admin */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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
              className="sm:hidden px-2 py-1.5 rounded-xl bg-stone-100/90 hover:bg-stone-200/80 active:scale-95 border border-stone-200/80 text-xs font-bold text-stone-800 flex items-center gap-1 shadow-2xs"
              title="Switch language"
            >
              <span className="text-sm">{language === 'vi' ? '🇻🇳' : '🇺🇸'}</span>
              <span className="text-[11px] font-mono">{language === 'vi' ? 'VI' : 'EN'}</span>
            </button>

            {/* Language Switcher: Desktop Pill */}
            <div className="hidden sm:flex items-center bg-stone-100/90 p-1 rounded-xl border border-stone-200 text-xs font-bold shadow-2xs">
              <button
                onClick={() => setLanguage('vi')}
                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] ${
                  language === 'vi'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Tiếng Việt"
              >
                <span>🇻🇳</span>
                <span>VI</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] ${
                  language === 'en'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="English"
              >
                <span>🇺🇸</span>
                <span>EN</span>
              </button>
            </div>

            {/* Settings Dropdown (Font Size + Login/Logout) */}
            <div className="relative">
              <button
                onClick={() => setShowSettings((prev) => !prev)}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
                  showSettings
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-700 border-stone-200/70'
                }`}
                title={language === 'vi' ? 'Cài đặt' : 'Settings'}
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettings && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSettings(false)}
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
                      className="w-full px-3.5 py-2.5 text-left hover:bg-stone-50 flex items-center justify-between text-stone-800 font-semibold"
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
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          logout();
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-red-50 flex items-center gap-2 text-red-600 font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('navLogout')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          openLoginModal();
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-800 font-semibold"
                      >
                        <LogIn className="w-3.5 h-3.5 text-amber-700" />
                        <span>{t('navLogin')}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Admin Button (when logged in) */}
            {isAdmin && (
              <button
                onClick={openAdminPortal}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('navAdmin')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
