import React, { useState } from 'react';
import { MapPin, Navigation, Copy, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CHURCH_NAME } from '../../constants/church.ts';
import { Modal, Card, DirectionButtons, Button } from '../../common-component/index.ts';
import { directionsModalStyles as s } from './DirectionsModal.styles.ts';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationName?: string;
  address?: string;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({
  isOpen,
  onClose,
  destinationName = CHURCH_NAME.en,
  address = CHURCH_NAME.address,
}) => {
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fallbackAddress = CHURCH_NAME.address;
  const cleanAddress = (address && !address.toLowerCase().includes('tempe, arizona') && address.toLowerCase() !== 'tempe, az' && address.toLowerCase() !== 'tempe az' ? address : fallbackAddress).trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-md"
      icon={
        <div className={s.headerIconBox}>
          <Navigation className="w-5 h-5" />
        </div>
      }
      subtitle={t('dirFromCurrent')}
      title={t('dirStartNav')}
    >
      {/* Destination Card */}
      <div className={s.body}>
        <Card variant="warm" padding="sm" className="space-y-2">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className={s.destName}>
                {destinationName}
              </p>
              <p className={s.destAddress}>
                {cleanAddress}
              </p>
            </div>
          </div>

          <div className={s.destFooter}>
            <span>{t('dirSelectedDest')}</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleCopy}
              leftIcon={
                copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
            >
              {copied ? (
                <span className="text-emerald-700">{t('dirCopied')}</span>
              ) : (
                <span>{t('dirCopyAddress')}</span>
              )}
            </Button>
          </div>
        </Card>

        <p className={s.promptText}>
          {t('dirChooseApp')}
        </p>

        {/* Common Reusable Map Choices */}
        <DirectionButtons
          address={cleanAddress}
          variant="detailed"
          onSelect={onClose}
        />
      </div>

      {/* Footer */}
      <div className={s.footer}>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onClose}
        >
          {t('commonClose')}
        </Button>
      </div>
    </Modal>
  );
};
