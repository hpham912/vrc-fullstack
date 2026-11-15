import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { bannerStyles } from './Banner.styles.ts';

export type BannerType = 'success' | 'error' | 'info' | 'warn';
export type BannerVariant = 'card' | 'strip' | 'text';

export interface BannerProps {
  type: BannerType;
  message: string;
  variant?: BannerVariant;
  // When provided, an X button is shown. Errors stay until dismissed
  // (the caller clears the message); success auto-hides on its own
  // timer, so it usually has no dismiss button.
  onDismiss?: () => void;
  className?: string;
}

const bannerIcons: Record<BannerType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warn: AlertTriangle,
};

export const Banner: React.FC<BannerProps> = ({
  type,
  message,
  variant = 'card',
  onDismiss,
  className = '',
}) => {
  const { t } = useLanguage();
  const Icon = bannerIcons[type];
  const tone = variant === 'text' ? bannerStyles.textTypes[type] : bannerStyles.types[type];
  const iconClass = variant === 'text' ? bannerStyles.textIcons[type] : bannerStyles.icons[type];
  const combinedClassName = `${bannerStyles.base} ${bannerStyles.variants[variant]} ${tone} ${className}`.trim();

  return (
    <div className={combinedClassName} role={type === 'error' ? 'alert' : 'status'}>
      <Icon className={iconClass} aria-hidden="true" />
      <span className="flex-1 text-left">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={bannerStyles.dismiss}
          aria-label={t('commonDismiss')}
          title={t('commonDismiss')}
        >
          <X className={bannerStyles.dismissIcon} />
        </button>
      )}
    </div>
  );
};
