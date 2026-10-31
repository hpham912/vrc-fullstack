import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Church,
  Calendar,
  BookOpen,
  Heart,
  ShieldCheck,
  LogIn,
  LogOut,
  Menu,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdminPortal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAdminPortal,
}) => {
  const { user, isAdmin, signInWithGoogle, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'verse', label: 'Daily Verse', icon: BookOpen },
    { id: 'events', label: 'Events Calendar', icon: Calendar },
    { id: 'prayers', label: 'Prayer Wall', icon: Heart },
    { id: 'about', label: 'Service Times & About', icon: Clock },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Church Name */}
          <div
            onClick={() => handleNavClick('verse')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-900/40 group-hover:scale-105 transition-transform">
              <Church className="w-6 h-6 text-stone-950" />
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white block">
                Grace & Truth
              </span>
              <span className="text-xs font-medium tracking-widest uppercase text-amber-400 block -mt-1">
                Community Church
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Admin / Login Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={openAdminPortal}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-semibold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  <ShieldCheck className="w-4 h-4 text-stone-950" />
                  Admin Portal
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Admin'}
                      className="w-8 h-8 rounded-full border border-amber-500"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-stone-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  <button
                    onClick={signOut}
                    title="Sign Out"
                    className="p-1.5 text-stone-400 hover:text-rose-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 rounded-lg text-sm font-medium transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                Admin Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={openAdminPortal}
                className="p-2 bg-amber-600 text-stone-950 font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-stone-400 hover:text-white hover:bg-stone-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-900 border-b border-stone-800 px-4 pt-2 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-4 border-t border-stone-800 flex flex-col gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => {
                    openAdminPortal();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 text-stone-950 font-semibold rounded-lg text-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Manage Events & Verses (Admin Portal)
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center justify-center gap-2 w-full py-2 text-stone-400 hover:text-rose-400 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({user?.displayName || user?.email})
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-stone-800 border border-stone-700 text-stone-200 rounded-lg text-sm font-medium"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                Admin Login (Google Sign-In)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
