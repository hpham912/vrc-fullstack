import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
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

  const desktopNavItems = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
    { id: 'youth', label: t('navYouth'), icon: Flame },
    { id: 'about', label: t('navAbout'), icon: Clock },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-200/60 transition-all pt-safe">
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

            {/* Mobile View: VRC on top, HTTLVN on bottom */}
            <div className="flex flex-col sm:hidden">
              <span className="font-serif text-sm font-bold tracking-tight text-stone-950 leading-tight">
                VRC
              </span>
              <span className="text-[10px] font-medium text-amber-800 tracking-normal leading-tight opacity-90">
                HTTLVN
              </span>
            </div>

            {/* Desktop View: Full name with English on top, Vietnamese on bottom */}
            <div className="hidden sm:flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-stone-950 leading-snug">
                Vietnamese Revival Church
              </span>
              <span className="text-xs font-medium text-amber-800 tracking-normal leading-tight opacity-90">
                Hội Thánh Phục Hưng Việt Nam
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

          {/* Right Header Controls: Notification, Language Toggle, and Admin */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notification Bell Button (Click to Open/Close Popup) */}
            <button
              onClick={() => {
                setShowNotifModal((prev) => !prev);
                if (!showNotifModal) {
                  onRequestNotificationPermission();
                }
              }}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl active:scale-95 transition-all relative z-[95] border ${
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

            {/* Admin Management / Login */}
            {isAdmin ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={openAdminPortal}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('navAdmin')}</span>
                </button>
                <button
                  onClick={logout}
                  title={t('navLogout')}
                  className="p-1.5 text-stone-400 hover:text-rose-600 active:scale-95 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 rounded-xl text-xs font-medium border border-stone-200/80 transition-all flex items-center gap-1"
                title={t('navLogin')}
              >
                <LogIn className="w-3.5 h-3.5 text-amber-800" />
                <span className="hidden sm:inline">{t('navLogin')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
