import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Clock, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

export const ChurchInfoSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-stone-200/80">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 block mb-1">
          {t('serviceTag')}
        </span>
        <h2 className="text-3xl font-serif font-bold text-stone-900">
          {t('serviceTitle')}
        </h2>
        <p className="text-stone-500 text-sm mt-2">
          {t('serviceSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Service Schedule */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs space-y-6">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900">
              {t('serviceTitle')}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">Tempe, Arizona</p>
          </div>

          <div className="space-y-4 text-sm divide-y divide-stone-100">
            <div className="pt-2">
              <span className="font-semibold text-stone-900 block">{t('sundayWorshipTitle')}</span>
              <p className="text-amber-700 text-xs font-semibold">{t('sundayWorshipTime')}</p>
              <p className="text-xs text-stone-500 mt-0.5">{t('sundayWorshipDesc')}</p>
            </div>

            <div className="pt-3">
              <span className="font-semibold text-stone-900 block">{t('fridayYouthTitle')}</span>
              <p className="text-amber-700 text-xs font-semibold">{t('fridayYouthTime')}</p>
              <p className="text-xs text-stone-500 mt-0.5">{t('fridayYouthDesc')}</p>
            </div>

            <div className="pt-3">
              <span className="font-semibold text-stone-900 block">{t('wedStudyTitle')}</span>
              <p className="text-amber-700 text-xs font-semibold">{t('wedStudyTime')}</p>
              <p className="text-xs text-stone-500 mt-0.5">{t('wedStudyDesc')}</p>
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs space-y-6">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            <MapPin className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900">{t('locationCardTitle')}</h3>
            <p className="text-xs text-stone-400 mt-0.5">Tempe, Arizona</p>
          </div>

          <div className="space-y-4 text-sm text-stone-700">
            <div>
              <p className="font-serif font-bold text-stone-900">
                Hội Thánh Phục Hưng Việt Nam<br />
                <span className="font-normal font-sans text-stone-600 text-xs">Vietnamese Revival Church</span>
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {t('locationCity')}<br />
                {t('locationRegion')}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-700" />
                <span>contact@vnrevivalchurch.org</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-700" />
                <span>(555) 777-VREV (8738)</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://maps.google.com/?q=Tempe+Arizona"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900"
              >
                <span>{t('directionsBtn')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
