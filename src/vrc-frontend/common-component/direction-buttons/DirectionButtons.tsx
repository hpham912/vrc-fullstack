import React from 'react';
import { Compass, Navigation, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getGoogleMapsDirectionsUrl, getAppleMapsDirectionsUrl } from '../../utils/directions.ts';
import { DEFAULT_EVENT_ADDRESS } from '../../constants/church.ts';
import { directionButtonsStyles as s } from './DirectionButtons.styles.ts';

interface DirectionButtonsProps {
  address: string;
  variant?: 'compact' | 'detailed';
  onSelect?: () => void;
  className?: string;
}

export const DirectionButtons: React.FC<DirectionButtonsProps> = ({
  address,
  variant = 'compact',
  onSelect,
  className = '',
}) => {
  const { language, t } = useLanguage();
  const cleanAddress = (address || '').trim();

  // The default address ("Liên hệ Hội Thánh") is not a real street
  // address, so there is nothing to route to — hide the buttons entirely.
  if (!cleanAddress || cleanAddress === DEFAULT_EVENT_ADDRESS) {
    return null;
  }

  const googleUrl = getGoogleMapsDirectionsUrl(cleanAddress);
  const appleUrl = getAppleMapsDirectionsUrl(cleanAddress);

  if (variant === 'detailed') {
    return (
      <div className={`${s.detailedGrid} ${className}`.trim()}>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onSelect}
          className={s.detailedGoogleBtn}
        >
          <div className={s.detailedLeftRow}>
            <div className={s.detailedGoogleIconBox}>
              <Compass className={s.detailedIcon} />
            </div>
            <div className={s.detailedTextCol}>
              <span className={s.detailedTitle}>Google</span>
              <span className={s.detailedGoogleSub}>
                {t('dirLive')}
              </span>
            </div>
          </div>
          <ExternalLink className={s.detailedGoogleExt} />
        </a>

        <a
          href={appleUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onSelect}
          className={s.detailedAppleBtn}
        >
          <div className={s.detailedLeftRow}>
            <div className={s.detailedAppleIconBox}>
              <Navigation className={s.detailedIcon} />
            </div>
            <div className={s.detailedTextCol}>
              <span className={s.detailedTitle}>Apple</span>
              <span className={s.detailedAppleSub}>
                {t('dirIos')}
              </span>
            </div>
          </div>
          <ExternalLink className={s.detailedAppleExt} />
        </a>
      </div>
    );
  }

  return (
    <div className={`${s.compactGroup} ${className}`.trim()}>
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSelect}
        className={s.compactGoogleBtn}
        title={t('dirGoogle')}
      >
        <Compass className={s.compactGoogleIcon} />
        <span>Google</span>
      </a>
      <a
        href={appleUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSelect}
        className={s.compactAppleBtn}
        title={t('dirApple')}
      >
        <Navigation className={s.compactAppleIcon} />
        <span>Apple</span>
      </a>
    </div>
  );
};
