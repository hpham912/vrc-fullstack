import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppNotification } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { CrossIcon } from './CrossIcon.tsx';
import {
  Bell,
  X,
  Calendar,
  BookOpen,
  Megaphone,
  CheckCircle2,
  Volume2,
  ExternalLink,
} from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onRequestPermission: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onRequestPermission,
  onSelectNotification,
}) => {
  const { language } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'verse':
        return <BookOpen className="w-4 h-4 text-amber-700" />;
      default:
        return <Megaphone className="w-4 h-4 text-rose-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'event':
        return {
          label: language === 'vi' ? 'Sự Kiện' : 'Event',
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'verse':
        return {
          label: language === 'vi' ? 'Lời Chúa' : 'Verse',
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      default:
        return {
          label: language === 'vi' ? 'Thông Báo' : 'Notice',
          classes: 'bg-rose-50 text-rose-700 border-rose-200',
        };
    }
  };

  return createPortal(
    <>
      {/* Full-screen backdrop preventing interaction with navbar, admin, or page content */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-stone-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      />

      {/* Popup Dialog stretching from below topbar down to above bottom tab bar */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={language === 'vi' ? 'Thông Báo Hội Thánh' : 'Church Notifications'}
        className="fixed top-[60px] sm:top-[86px] inset-x-2.5 sm:left-auto sm:right-6 sm:w-[420px] bottom-[72px] md:bottom-auto md:max-h-[min(650px,calc(100vh-110px))] z-[100] bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base leading-tight">
                {language === 'vi' ? 'Thông Báo Hội Thánh' : 'Church Notifications'}
              </h3>
              <p className="text-stone-400 text-[11px]">
                {language === 'vi' ? 'Tin tức & lịch sinh hoạt mới nhất' : 'Recent church updates & news'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Đóng / Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification Banner */}
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-stone-800 text-[11px]">
            <Volume2 className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
            <span>
              {language === 'vi'
                ? 'Nhận thông báo sự kiện & câu Kinh Thánh'
                : 'Get alerts for events and scripture'}
            </span>
          </div>
          <button
            type="button"
            onClick={onRequestPermission}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-[11px] whitespace-nowrap shadow-2xs transition-all"
          >
            {language === 'vi' ? 'Bật' : 'Enable'}
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-stone-600 font-semibold text-xs">
                {language === 'vi' ? 'Chưa có thông báo nào mới' : 'No new notifications'}
              </p>
              <p className="text-stone-400 text-[11px]">
                {language === 'vi'
                  ? 'Khi có lịch thờ phượng hoặc Lời Chúa mới, thông báo sẽ hiển thị ở đây.'
                  : 'Upcoming worship events and devotionals will appear here.'}
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const badge = getTypeBadge(item.type);
              const formattedDate = new Date(item.createdAt).toLocaleDateString(
                language === 'vi' ? 'vi-VN' : 'en-US',
                { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              );

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectNotification?.(item)}
                  className="p-3 rounded-2xl bg-stone-50/80 border border-stone-200/80 hover:bg-white hover:border-amber-300 hover:shadow-2xs transition-all text-left space-y-1.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center">
                        {getIconForType(item.type)}
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {formattedDate}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 leading-snug group-hover:text-amber-900 transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2">
                    {item.body}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center gap-1 font-serif font-bold text-stone-700">
            <CrossIcon className="w-3 h-3 text-amber-600" />
            <span>Vietnamese Revival Church</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold transition-colors text-[11px]"
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};
