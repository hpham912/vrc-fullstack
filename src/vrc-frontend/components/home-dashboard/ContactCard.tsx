import React from 'react';
import { Clock, Mail, MapPin, PenTool, Phone } from 'lucide-react';
import { ChurchInfo } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Button, Card, DirectionButtons } from '../../common-component/index.ts';
import { contactCardStyles } from './ContactCard.styles.ts';

export interface ContactCardProps {
  churchInfo: ChurchInfo;
  churchAddress: string;
  sundayTime: string | null;
  isAdmin: boolean;
  onOpenChurchInfoEditor?: () => void;
}

// The contact card at the bottom of Home (id="sanctuary-location" so
// the quick-nav Sanctuary card can scroll to it): address + directions,
// phone, email, Sunday worship hours, and the social links.
export const ContactCard: React.FC<ContactCardProps> = ({
  churchInfo,
  churchAddress,
  sundayTime,
  isAdmin,
  onOpenChurchInfoEditor,
}) => {
  const { t } = useLanguage();

  return (
    <Card as="section" id="sanctuary-location" variant="default" padding="md" className={contactCardStyles.contactCard}>
      <div className={contactCardStyles.contactHeader}>
        <span className={contactCardStyles.contactHeaderLabel}>
          <Mail className="w-3.5 h-3.5 text-amber-600" />
          <span>{t('contactLead')}</span>
        </span>
        {isAdmin && onOpenChurchInfoEditor && (
          <Button
            type="button"
            variant="amberLight"
            size="xs"
            onClick={onOpenChurchInfoEditor}
            title={t('contactEditTitle')}
            leftIcon={<PenTool className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">{t('contactEditTitle')}</span>
          </Button>
        )}
      </div>

      <div className={contactCardStyles.contactList}>
        {/* Address + Directions */}
        <div className={contactCardStyles.contactRow}>
          <div className={contactCardStyles.contactIconChip}>
            <MapPin className="w-4 h-4" />
          </div>
          <div className={contactCardStyles.contactTextCol}>
            <span className={contactCardStyles.contactLabel}>{t('contactAddressLabel')}</span>
            <span className={contactCardStyles.contactValue}>{churchAddress}</span>
            <div className={contactCardStyles.contactDirections}>
              <DirectionButtons address={churchAddress} />
            </div>
          </div>
        </div>

        {/* Phone */}
        {churchInfo.phone && (
          <div className={contactCardStyles.contactRow}>
            <div className={contactCardStyles.contactIconChip}>
              <Phone className="w-4 h-4" />
            </div>
            <div className={contactCardStyles.contactTextCol}>
              <span className={contactCardStyles.contactLabel}>{t('contactPhoneLabel')}</span>
              <a
                href={`tel:${churchInfo.phone.replace(/[^0-9+]/g, '')}`}
                className={contactCardStyles.contactValueLink}
              >
                {churchInfo.phone}
              </a>
            </div>
          </div>
        )}

        {/* Email */}
        {churchInfo.email && (
          <div className={contactCardStyles.contactRow}>
            <div className={contactCardStyles.contactIconChip}>
              <Mail className="w-4 h-4" />
            </div>
            <div className={contactCardStyles.contactTextCol}>
              <span className={contactCardStyles.contactLabel}>{t('contactEmailLabel')}</span>
              <a href={`mailto:${churchInfo.email}`} className={contactCardStyles.contactValueLink}>
                {churchInfo.email}
              </a>
            </div>
          </div>
        )}

        {/* Sunday worship hours */}
        {sundayTime && (
          <div className={contactCardStyles.contactRow}>
            <div className={contactCardStyles.contactIconChip}>
              <Clock className="w-4 h-4" />
            </div>
            <div className={contactCardStyles.contactTextCol}>
              <span className={contactCardStyles.contactLabel}>{t('contactHoursLabel')}</span>
              <span className={contactCardStyles.contactValue}>{sundayTime}</span>
            </div>
          </div>
        )}
      </div>

      <div className={contactCardStyles.contactDivider} />

      {/* Socials */}
      <div className={contactCardStyles.contactSocials}>
        <span className={contactCardStyles.contactSocialLabel}>{t('contactFollowLabel')}</span>
        <div className={contactCardStyles.socialCircles}>
          <a
            href="https://www.youtube.com/@PHUCHUNGAZ"
            target="_blank"
            rel="noopener noreferrer"
            className={contactCardStyles.socialCircleYoutube}
            aria-label="YouTube"
          >
            <svg className={contactCardStyles.socialCircleIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>

          <a
            href="https://www.facebook.com/phuchungus"
            target="_blank"
            rel="noopener noreferrer"
            className={contactCardStyles.socialCircleFacebook}
            aria-label="Facebook"
          >
            <svg className={contactCardStyles.socialCircleIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>
      </div>
    </Card>
  );
};
