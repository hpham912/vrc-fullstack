import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  Calendar,
  BookOpen,
  Clock,
  ShieldCheck,
  LogIn,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdminPortal: () => void;
  openLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAdminPortal,
  openLoginModal,
}) => {
  const { adminUser, isAdmin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
    { id: 'about', label: t('navAbout'), icon: Clock },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-stone-200/60 transition-all pt-safe">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title: English on Top (Bold), Vietnamese on Bottom (Smaller) as requested */}
          <button
            onClick={() => setActiveTab('events')}
            className="flex items-center gap-3 text-left group transition-transform active:scale-[0.98]"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center font-serif text-base sm:text-lg font-bold shadow-xs group-hover:bg-amber-600 group-hover:text-white transition-all flex-shrink-0">
              ✝
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-stone-950 leading-snug">
                Vietnamese Revival Church
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-amber-800 tracking-normal leading-tight opacity-90">
                Hội Thánh Phục Hưng Việt Nam
              </span>
            </div>
          </button>

          {/* Desktop Nav Pills */}
          <nav className="hidden md:flex items-center bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60">
            {navItems.map((item) => {
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

          {/* Right: Language Pill Switcher & Admin Action */}
          <div className="flex items-center gap-2">
            {/* iOS Segmented Language Switcher Pill */}
            <div className="flex items-center bg-stone-100/90 p-0.5 sm:p-1 rounded-xl border border-stone-200 text-xs font-bold shadow-2xs">
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
            </div>

            {/* Admin status / Login button */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
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
                  <LogOut className="w-4 h-4" />
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
