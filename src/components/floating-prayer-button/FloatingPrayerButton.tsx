import React from 'react';
import { useLanguage } from '../../vrc-frontend/context/LanguageContext.tsx';
import { HeartHandshake } from 'lucide-react';
import { floatingPrayerButtonStyles as s } from './FloatingPrayerButton.styles.ts';

interface FloatingPrayerButtonProps {
  onOpen: () => void;
}

// Floating glass prayer request button (Home tab only, sticky above
// the bottom bar).
export const FloatingPrayerButton: React.FC<FloatingPrayerButtonProps> = ({ onOpen }) => {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onOpen}
      className={s.floatingPrayerBtn}
      title={t('prayerRequestTitle')}
      aria-label={t('navPrayer')}
    >
      <div className={s.floatingPrayerIconBox}>
        <HeartHandshake className={s.floatingPrayerIcon} />
      </div>
      <span className={s.floatingPrayerText}>
        {t('navPrayer')}
      </span>
    </button>
  );
};
