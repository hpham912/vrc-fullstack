import React from 'react';
import { Compass, Navigation, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getGoogleMapsDirectionsUrl, getAppleMapsDirectionsUrl } from '../../utils/directions.ts';
import { directionButtonsStyles as s } from './DirectionButtons.styles.ts';

interface DirectionButtonsProps {
  address: string;
  variant?: 'compact' | 'detailed';
  shortLabels?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const DirectionButtons: React.FC<DirectionButtonsProps> = ({
  address,
  variant = 'compact',
  shortLabels = false,
  onSelect,
  className = '',
}) => {
  const { language } = useLanguage();
  const googleUrl = getGoogleMapsDirectionsUrl(address);
  const appleUrl = getAppleMapsDirectionsUrl(address);

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
              <span className={s.detailedTitle}>Google Maps</span>
              <span className={s.detailedGoogleSub}>
                {language === 'vi' ? 'Chỉ đường tức thì' : 'Live directions'}
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
              <span className={s.detailedTitle}>Apple Maps</span>
              <span className={s.detailedAppleSub}>
                {language === 'vi' ? 'Dẫn đường iOS' : 'iOS turn-by-turn'}
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
        title={language === 'vi' ? 'Chỉ đường Google Maps' : 'Google Maps Directions'}
      >
        <Compass className={s.compactGoogleIcon} />
        <span>{shortLabels ? 'Google' : 'Google Maps'}</span>
      </a>
      <a
        href={appleUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSelect}
        className={s.compactAppleBtn}
        title={language === 'vi' ? 'Chỉ đường Apple Maps' : 'Apple Maps Directions'}
      >
        <Navigation className={s.compactAppleIcon} />
        <span>{shortLabels ? 'Apple' : 'Apple Maps'}</span>
      </a>
    </div>
  );
};
