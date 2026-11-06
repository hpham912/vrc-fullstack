import React, { useState } from 'react';
import { ChurchEvent } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { CrossIcon } from './CrossIcon.tsx';
import {
  Flame,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Users,
  Music,
  Heart,
  Send,
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { getGoogleCalendarUrl } from '../utils/calendar.ts';

interface YouthSectionProps {
  events: ChurchEvent[];
  isAdmin: boolean;
  onOpenAdminPortal?: (tab?: string) => void;
}

export const YouthSection: React.FC<YouthSectionProps> = ({
  events,
  isAdmin,
  onOpenAdminPortal,
}) => {
  const { language, t } = useLanguage();
  const [connectName, setConnectName] = useState('');
  const [connectContact, setConnectContact] = useState('');
  const [connectSubmitted, setConnectSubmitted] = useState(false);

  // Filter youth events
  const youthEvents = events.filter(
    (e) =>
      e.category.toLowerCase().includes('youth') ||
      e.title.toLowerCase().includes('youth') ||
      e.title.toLowerCase().includes('giới trẻ') ||
      e.title.toLowerCase().includes('thanh niên')
  );

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectName.trim()) return;
    setConnectSubmitted(true);
    setTimeout(() => {
      setConnectName('');
      setConnectContact('');
    }, 3000);
  };

  return (
    <div className="py-4 sm:py-8 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Youth Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-stone-900 to-amber-950 text-white rounded-3xl p-5 sm:p-8 shadow-md border border-emerald-900/60">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-[11px] font-bold text-emerald-300 tracking-wide uppercase">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('youthMinistryTag')}</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-tight">
              {language === 'vi' ? 'Mục Vụ Giới Trẻ VRC' : 'VRC Youth & Young Adults'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-100 leading-relaxed max-w-xl font-medium">
              {t('youthWelcome')}
            </p>
          </div>

          {/* Scripture Anchor Badge */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/20 text-stone-100 text-xs sm:text-sm italic font-serif leading-relaxed">
            "{t('youthVerseText')}"
          </div>
        </div>
      </div>

      {/* Friday Youth Night Spotlight Card */}
      <section className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
              <Flame className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                {language === 'vi' ? 'Hàng Tuần • Weekly Gathering' : 'Weekly Gathering'}
              </span>
              <h2 className="text-base sm:text-xl font-serif font-bold text-stone-950">
                {t('youthNightTitle')}
              </h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold rounded-full w-fit">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('youthNightTime')}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-stone-700">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
            <span className="font-bold text-stone-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'vi' ? 'Địa Điểm' : 'Location'}</span>
            </span>
            <p className="text-stone-600 text-xs leading-relaxed">
              {t('youthNightLoc')}<br />
              Tempe, Arizona
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
            <span className="font-bold text-stone-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'vi' ? 'Đối Tượng' : 'Who is Welcome'}</span>
            </span>
            <p className="text-stone-600 text-xs leading-relaxed">
              {language === 'vi'
                ? 'Học sinh trung học, sinh viên đại học & thanh niên đi làm.'
                : 'High school students, college students & young professionals.'}
            </p>
          </div>
        </div>

        {/* 4 Pillars of Youth */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1">
            <Music className="w-5 h-5 text-emerald-700 mx-auto" />
            <span className="text-xs font-bold text-stone-950 block">
              {language === 'vi' ? 'Thờ Phượng' : 'Live Worship'}
            </span>
            <span className="text-[11px] text-stone-700 block leading-tight font-medium">
              {language === 'vi' ? 'Ban nhạc trẻ & ca ngợi' : 'Dynamic acoustic & band'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-1">
            <Sparkles className="w-5 h-5 text-amber-700 mx-auto" />
            <span className="text-xs font-bold text-stone-950 block">
              {language === 'vi' ? 'Học Lời Chúa' : 'Bible Truth'}
            </span>
            <span className="text-[11px] text-stone-700 block leading-tight font-medium">
              {language === 'vi' ? 'Ứng dụng thực tế' : 'Real-life faith application'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center space-y-1">
            <Users className="w-5 h-5 text-indigo-700 mx-auto" />
            <span className="text-xs font-bold text-stone-950 block">
              {language === 'vi' ? 'Nhóm Nhỏ' : 'Small Groups'}
            </span>
            <span className="text-[11px] text-stone-700 block leading-tight font-medium">
              {language === 'vi' ? 'Chia sẻ & cầu thay' : 'Heart-to-heart prayer'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-center space-y-1">
            <Heart className="w-5 h-5 text-rose-700 mx-auto" />
            <span className="text-xs font-bold text-stone-950 block">
              {language === 'vi' ? 'Thông Công' : 'Fellowship'}
            </span>
            <span className="text-[11px] text-stone-700 block leading-tight font-medium">
              {language === 'vi' ? 'Trò chơi, boba & ăn nhẹ' : 'Snacks, boba & games'}
            </span>
          </div>
        </div>
      </section>

      {/* Upcoming Youth Events Calendar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-serif font-bold text-stone-950 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{t('viewYouthEvents')}</span>
          </h2>
          <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            {youthEvents.length} {language === 'vi' ? 'sự kiện' : 'events'}
          </span>
        </div>

        {youthEvents.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-3xl border border-stone-200 space-y-2">
            <Flame className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-stone-950">
              {language === 'vi'
                ? 'Đêm Giới Trẻ Thứ Sáu diễn ra đều đặn hàng tuần lúc 6:30 PM!'
                : 'Friday Youth Fellowship gathers weekly at 6:30 PM!'}
            </p>
            <p className="text-xs text-stone-700 font-medium">
              {language === 'vi'
                ? 'Hãy đến và mời thêm bạn bè cùng tham gia.'
                : 'Join us and bring your friends along.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {youthEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md uppercase">
                      {evt.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-serif font-bold text-stone-950 mt-1">
                      {evt.title}
                    </h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-stone-950 block">{evt.date}</span>
                    <span className="text-xs text-stone-700 font-semibold">{evt.startTime}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-normal">
                  {evt.description}
                </p>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-xs text-stone-700 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    <span>{evt.location}</span>
                  </span>

                  <a
                    href={getGoogleCalendarUrl(evt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all active:scale-95 border border-emerald-200"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t('addToGoogle')}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Connect With Youth Form */}
      <section className="bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/50 rounded-3xl border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            {language === 'vi' ? 'Kết Nối • Get Connected' : 'Get Connected'}
          </span>
          <h2 className="text-base sm:text-lg font-serif font-bold text-stone-950">
            {language === 'vi' ? 'Bạn Mới Tham Gia? Kết Nối Ngay!' : 'New to Youth? Connect With Us!'}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            {language === 'vi'
              ? 'Để lại thông tin để Ban Tráng Niên / Giới Trẻ liên hệ đón tiếp bạn vào Thứ Sáu tới.'
              : 'Leave your info so our youth team can welcome you this Friday.'}
          </p>
        </div>

        {connectSubmitted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'vi'
                ? 'Cảm ơn bạn! Ban Giới Trẻ VRC sẽ liên hệ sớm nhất để đón tiếp bạn.'
                : 'Thank you! The VRC Youth team will reach out soon to welcome you.'}
            </span>
          </div>
        ) : (
          <form onSubmit={handleConnectSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder={language === 'vi' ? 'Họ và tên của bạn' : 'Your full name'}
                value={connectName}
                onChange={(e) => setConnectName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <input
                type="text"
                placeholder={language === 'vi' ? 'Số điện thoại hoặc Email / Instagram' : 'Phone or Email / Instagram'}
                value={connectContact}
                onChange={(e) => setConnectContact(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('youthJoinBtn')}</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
