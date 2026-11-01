import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  Calendar,
  BookOpen,
  Clock,
  ShieldCheck,
  LogIn,
  LogOut,
  Menu,
  X,
  Globe,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
    { id: 'about', label: t('navAbout'), icon: Clock },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Church Name - Keeps BOTH languages in title as requested */}
          <button
            onClick={() => handleNavClick('events')}
            className="flex items-center gap-3.5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center font-serif text-lg font-bold shadow-xs group-hover:bg-amber-600 group-hover:text-white transition-all">
              ✝
            </div>
            <div>
              <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-stone-900 block leading-tight">
                Hội Thánh Phục Hưng Việt Nam
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-amber-800 uppercase block">
                Vietnamese Revival Church
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-75" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right actions: Language Flip & Admin Login */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
              <button
                onClick={() => setLanguage('vi')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  language === 'vi'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Tiếng Việt"
              >
                <span>🇻🇳</span>
                <span>VI</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  language === 'en'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="English"
              >
                <span>🇺🇸</span>
                <span>EN</span>
              </button>
            </div>

            {/* Admin Controls */}
            {isAdmin ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
                <button
                  onClick={openAdminPortal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('navAdmin')}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center text-xs font-bold">
                    {adminUser?.displayName.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <button
                    onClick={logout}
                    title={t('navLogout')}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 rounded-xl text-xs font-medium transition-all border border-stone-200"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-700" />
                <span>{t('navLogin')}</span>
              </button>
            )}
          </div>

          {/* Mobile menu and language toggle */}
          <div className="md:hidden flex items-center gap-2">
            {/* Quick mobile language toggle */}
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="px-2 py-1 bg-stone-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-stone-200"
            >
              <span>{language === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}</span>
            </button>

            {isAdmin && (
              <button
                onClick={openAdminPortal}
                className="px-2.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => {
                    openAdminPortal();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-600 text-white font-medium rounded-xl text-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {t('adminDashboardTitle')}
                </button>
                <button
                  onClick={logout}
                  className="text-center py-2 text-stone-500 hover:text-rose-600 text-xs font-medium"
                >
                  {t('navLogout')} ({adminUser?.displayName || adminUser?.username})
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal();
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-xl text-xs"
              >
                <LogIn className="w-4 h-4 text-amber-700" />
                {t('navLogin')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
