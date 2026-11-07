import React, { useState } from 'react';
import { ChurchEvent } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CrossIcon } from '../cross-icon/CrossIcon.tsx';
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
import { CalendarButtons, Card, Button } from '../../common-component/index.ts';
import { formatWeekdayAndDate } from '../../utils/dateFormatter.ts';
import { youthSectionStyles as s } from './YouthSection.styles.ts';

interface YouthSectionProps {
  events: ChurchEvent[];
  isAdmin: boolean;
  onOpenAdminPortal?: (tab?: string) => void;
}

export const YouthSection: React.FC<YouthSectionProps> = ({
  events,
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
    <div className={s.container}>
      {/* Youth Hero Banner */}
      <div className={s.heroBanner}>
        <div className={s.heroGlow} />
        <div className={s.heroInner}>
          <div className={s.heroBadge}>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('youthMinistryTag')}</span>
          </div>

          <div className="space-y-1">
            <h1 className={s.heroTitle}>
              {language === 'vi' ? 'Mục Vụ Giới Trẻ VRC' : 'VRC Youth & Young Adults'}
            </h1>
            <p className={s.heroDesc}>
              {t('youthWelcome')}
            </p>
          </div>

          {/* Scripture Anchor Badge */}
          <div className={s.scriptureBox}>
            "{t('youthVerseText')}"
          </div>
        </div>
      </div>

      {/* Friday Youth Night Spotlight Card */}
      <Card as="section" variant="elevated" padding="lg" className="space-y-5">
        <div className={s.spotlightHeader}>
          <div className="flex items-center gap-3">
            <div className={s.spotlightIconBox}>
              <Flame className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <span className={s.spotlightTag}>
                {language === 'vi' ? 'Hàng Tuần • Weekly Gathering' : 'Weekly Gathering'}
              </span>
              <h2 className={s.spotlightTitle}>
                {t('youthNightTitle')}
              </h2>
            </div>
          </div>

          <span className={s.timePill}>
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('youthNightTime')}</span>
          </span>
        </div>

        <div className={s.infoGrid}>
          <Card variant="subtle" padding="sm" className="space-y-1.5">
            <span className={s.infoLabel}>
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'vi' ? 'Địa Điểm' : 'Location'}</span>
            </span>
            <p className={s.infoText}>
              {t('youthNightLoc')}<br />
              Tempe, Arizona
            </p>
          </Card>

          <Card variant="subtle" padding="sm" className="space-y-1.5">
            <span className={s.infoLabel}>
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'vi' ? 'Đối Tượng' : 'Who is Welcome'}</span>
            </span>
            <p className={s.infoText}>
              {language === 'vi'
                ? 'Học sinh trung học, sinh viên đại học & thanh niên đi làm.'
                : 'High school students, college students & young professionals.'}
            </p>
          </Card>
        </div>

        {/* 4 Pillars of Youth */}
        <div className={s.pillarsGrid}>
          <div className={s.pillarEmerald}>
            <Music className="w-5 h-5 text-emerald-700 mx-auto" />
            <span className={s.pillarTitle}>
              {language === 'vi' ? 'Thờ Phượng' : 'Live Worship'}
            </span>
            <span className={s.pillarSub}>
              {language === 'vi' ? 'Ban nhạc trẻ & ca ngợi' : 'Dynamic acoustic & band'}
            </span>
          </div>

          <div className={s.pillarAmber}>
            <Sparkles className="w-5 h-5 text-amber-700 mx-auto" />
            <span className={s.pillarTitle}>
              {language === 'vi' ? 'Học Lời Chúa' : 'Bible Truth'}
            </span>
            <span className={s.pillarSub}>
              {language === 'vi' ? 'Ứng dụng thực tế' : 'Real-life faith application'}
            </span>
          </div>

          <div className={s.pillarIndigo}>
            <Users className="w-5 h-5 text-indigo-700 mx-auto" />
            <span className={s.pillarTitle}>
              {language === 'vi' ? 'Nhóm Nhỏ' : 'Small Groups'}
            </span>
            <span className={s.pillarSub}>
              {language === 'vi' ? 'Chia sẻ & cầu thay' : 'Heart-to-heart prayer'}
            </span>
          </div>

          <div className={s.pillarRose}>
            <Heart className="w-5 h-5 text-rose-700 mx-auto" />
            <span className={s.pillarTitle}>
              {language === 'vi' ? 'Thông Công' : 'Fellowship'}
            </span>
            <span className={s.pillarSub}>
              {language === 'vi' ? 'Trò chơi, boba & ăn nhẹ' : 'Snacks, boba & games'}
            </span>
          </div>
        </div>
      </Card>

      {/* Upcoming Youth Events Calendar */}
      <section className={s.eventsSection}>
        <div className={s.eventsHeader}>
          <h2 className={s.eventsTitle}>
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{t('viewYouthEvents')}</span>
          </h2>
          <span className={s.eventsCountBadge}>
            {youthEvents.length} {language === 'vi' ? 'sự kiện' : 'events'}
          </span>
        </div>

        {youthEvents.length === 0 ? (
          <Card variant="emeraldWarm" padding="lg" className="text-center space-y-2">
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
          </Card>
        ) : (
          <div className="space-y-3">
            {youthEvents.map((evt) => (
              <Card key={evt.id} variant="default" padding="md" className="space-y-2.5 hover:border-emerald-300">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={s.eventCategoryTag}>
                      {evt.category}
                    </span>
                    <h3 className={s.eventCardTitle}>
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

                  <CalendarButtons
                    event={evt}
                    showIcal={false}
                    gcalLabel={t('addToGoogle')}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Connect With Youth Form */}
      <Card as="section" variant="elevated" padding="lg" className="space-y-4">
        <div>
          <span className={s.spotlightTag}>
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
          <div className={s.connectSubmittedBox}>
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
                className={s.connectInput}
              />
              <input
                type="text"
                placeholder={language === 'vi' ? 'Số điện thoại hoặc Email / Instagram' : 'Phone or Email / Instagram'}
                value={connectContact}
                onChange={(e) => setConnectContact(e.target.value)}
                className={s.connectInput}
              />
            </div>
            <Button
              type="submit"
              variant="emerald"
              size="lg"
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              <span>{t('youthJoinBtn')}</span>
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
