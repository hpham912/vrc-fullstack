import React, { useState } from 'react';
import { ChurchInfo, WeeklyService, DEFAULT_CHURCH_INFO, DEFAULT_HEADER_VERSE } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import { getGoogleMapsDirectionsUrl, getAppleMapsDirectionsUrl } from '../../utils/directions.ts';
import { CrossIcon } from '../cross-icon/CrossIcon.tsx';
import {
  Save,
  MapPin,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Building2,
  Plus,
  Video,
} from 'lucide-react';
import { Modal, Card, Button, AdminActionButtons, AdminAddButton } from '../../common-component/index.ts';
import { editChurchInfoModalStyles as s } from './EditChurchInfoModal.styles.ts';

interface EditChurchInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchInfo?: ChurchInfo | null;
  onSaved: (updated: ChurchInfo) => void;
}

export const EditChurchInfoModal: React.FC<EditChurchInfoModalProps> = ({
  isOpen,
  onClose,
  churchInfo,
  onSaved,
}) => {
  const { getToken } = useAuth();
  const { language, t } = useLanguage();

  const safeInfo = churchInfo || DEFAULT_CHURCH_INFO;

  const [sanctuaryName, setSanctuaryName] = useState(safeInfo.sanctuaryName || 'Hội Thánh Tin Lành Báp-tít Phục Hưng');
  const [address, setAddress] = useState(safeInfo.address || '1565 E Warner Rd, Tempe AZ 85284');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    safeInfo.googleMapsUrl || 'https://maps.google.com/?q=1565+E+Warner+Rd,+Tempe+AZ+85284'
  );
  const [phone, setPhone] = useState(safeInfo.phone || '(480) 555-0199');
  const [email, setEmail] = useState(safeInfo.email || 'htph@vrcfamily.org');
  const [regionDescVi, setRegionDescVi] = useState(
    safeInfo.regionDescVi || 'Phục vụ cộng đồng người Việt tại Tempe, Phoenix, Mesa, Chandler & Gilbert'
  );
  const [regionDescEn, setRegionDescEn] = useState(
    safeInfo.regionDescEn || 'Serving Vietnamese communities across Phoenix East Valley'
  );
  // Church default Zoom meeting (used by the shared Zoom button on
  // events). Admin-only: these values are never rendered anywhere
  // else in the app.
  const [zoomMeetingId, setZoomMeetingId] = useState(safeInfo.zoomMeetingId || '');
  const [zoomPasscode, setZoomPasscode] = useState(safeInfo.zoomPasscode || '');

  const [services, setServices] = useState<WeeklyService[]>(
    safeInfo.services ? [...safeInfo.services] : [...DEFAULT_CHURCH_INFO.services]
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state whenever modal is opened or churchInfo prop changes
  React.useEffect(() => {
    if (isOpen) {
      const current = churchInfo || DEFAULT_CHURCH_INFO;
      setSanctuaryName(current.sanctuaryName || 'Hội Thánh Tin Lành Báp-tít Phục Hưng');
      setAddress(current.address || '1565 E Warner Rd, Tempe AZ 85284');
      setGoogleMapsUrl(current.googleMapsUrl || 'https://maps.google.com/?q=1565+E+Warner+Rd,+Tempe+AZ+85284');
      setPhone(current.phone || '(480) 555-0199');
      setEmail(current.email || 'htph@vrcfamily.org');
      setRegionDescVi(current.regionDescVi || 'Phục vụ cộng đồng người Việt tại Tempe, Phoenix, Mesa, Chandler & Gilbert');
      setRegionDescEn(current.regionDescEn || 'Serving Vietnamese communities across Phoenix East Valley');
      setZoomMeetingId(current.zoomMeetingId || '');
      setZoomPasscode(current.zoomPasscode || '');
      setServices(current.services ? JSON.parse(JSON.stringify(current.services)) : [...DEFAULT_CHURCH_INFO.services]);
    }
  }, [isOpen, churchInfo]);

  if (!isOpen) return null;

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    setGoogleMapsUrl(`https://maps.google.com/?q=${encodeURIComponent(newAddress.trim())}`);
  };

  const handleAddService = () => {
    setServices((prev) => [
      ...prev,
      {
        id: `service-${Date.now()}`,
        titleVi: '',
        titleEn: '',
        time: '',
        timeEn: '',
        descVi: '',
        descEn: '',
      },
    ]);
  };

  const handleDeleteService = (index: number) => {
    setServices((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Convert Vietnamese day string to English
  const translateVietnameseDayToEnglish = (timeStr: string) => {
    const parts = timeStr.split('•');
    const day = (parts[0] || '').trim();
    const time = parts.slice(1).join('•').trim();
    let engDay = day;
    const lower = day.toLowerCase();
    if (lower.includes('chúa nhật') || lower.includes('chua nhat')) engDay = 'Sunday';
    else if (lower.includes('thứ hai') || lower.includes('thu hai')) engDay = 'Monday';
    else if (lower.includes('thứ ba') || lower.includes('thu ba')) engDay = 'Tuesday';
    else if (lower.includes('thứ tư') || lower.includes('thu tu')) engDay = 'Wednesday';
    else if (lower.includes('thứ năm') || lower.includes('thu nam')) engDay = 'Thursday';
    else if (lower.includes('thứ sáu') || lower.includes('thu sau')) engDay = 'Friday';
    else if (lower.includes('thứ bảy') || lower.includes('thu bay')) engDay = 'Saturday';
    return time ? `${engDay} • ${time}` : engDay;
  };

  const updateServiceField = (index: number, field: keyof WeeklyService, value: string) => {
    setServices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'time' && !updated[index].timeEn) {
        updated[index].timeEn = translateVietnameseDayToEnglish(value);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanctuaryName.trim() || !address.trim()) {
      setFeedback({
        type: 'error',
        message: t('churchInfoFillBoth'),
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const token = getToken();

      const processedServices = services.map((svc) => ({
        ...svc,
        titleEn: svc.titleEn?.trim() || svc.titleVi.trim(),
        timeEn: (svc.timeEn && svc.timeEn.trim() && !svc.timeEn.toLowerCase().includes('thứ') && !svc.timeEn.toLowerCase().includes('chúa nhật'))
          ? svc.timeEn.trim()
          : translateVietnameseDayToEnglish(svc.time),
        descEn: svc.descEn?.trim() || svc.descVi.trim(),
      }));

      const payload: Partial<ChurchInfo> = {
        sanctuaryName: sanctuaryName.trim(),
        address: address.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        phone: phone.trim(),
        email: email.trim(),
        regionDescVi: regionDescVi.trim(),
        regionDescEn: regionDescEn.trim(),
        headerVerse: safeInfo.headerVerse || DEFAULT_HEADER_VERSE,
        services: processedServices,
        zoomMeetingId: zoomMeetingId.trim(),
        zoomPasscode: zoomPasscode.trim(),
      };

      const res = await fetch(apiUrl('/api/church-info'), {
        method: 'PUT',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update church information');
      }

      const savedData: ChurchInfo = await res.json();
      try {
        localStorage.setItem('vrc_cached_church_info', JSON.stringify(savedData));
      } catch (e) {
        console.warn('Could not write church info to localStorage:', e);
      }
      setFeedback({
        type: 'success',
        message: t('churchInfoSaved'),
      });
      onSaved(savedData);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving church info:', err);
      setFeedback({
        type: 'error',
        message: err.message || t('churchInfoSaveFailed'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      icon={<Building2 className={s.headerIcon} />}
      subtitle={t('churchInfoSubtitle')}
      title={t('churchInfoTitle')}
    >
      {/* Feedback alert */}
      {feedback && (
        <div
          className={`${s.alertBase} ${
            feedback.type === 'success' ? s.alertSuccess : s.alertError
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className={s.alertIconSuccess} />
          ) : (
            <AlertCircle className={s.alertIconError} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className={s.form}>
        {/* Section 1: Sanctuary Location & Directions */}
        <Card variant="warm" padding="md" className="space-y-3">
            <h4 className={s.sectionTitle}>
              <MapPin className={s.mapPinIcon} />
              <span>{t('churchInfoSanctuary')}</span>
            </h4>

            <div className={s.fieldGroup}>
              <label className={s.label}>
                {t('churchInfoName')}
              </label>
              <input
                type="text"
                value={sanctuaryName}
                onChange={(e) => setSanctuaryName(e.target.value)}
                className={s.inputMedium}
                placeholder="Hội Thánh Phục Hưng Việt Nam • Tempe Sanctuary"
              />
            </div>

            <div className={s.gridTwoCols}>
              <div className={s.fieldGroup}>
                <label className={s.label}>
                  {t('churchInfoAddress')}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className={s.inputMedium}
                  placeholder="Tempe, Arizona"
                />
              </div>

              <div className={s.fieldGroup}>
                <label className={s.labelWithRow}>
                  <span>{t('churchInfoMaps')}</span>
                  <div className={s.mapLinksGroup}>
                    <a
                      href={getGoogleMapsDirectionsUrl(address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={s.googleMapLink}
                    >
                      <span>Google</span>
                      <ExternalLink className={s.externalIcon} />
                    </a>
                    <span>•</span>
                    <a
                      href={getAppleMapsDirectionsUrl(address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={s.appleMapLink}
                    >
                      <span>Apple</span>
                      <ExternalLink className={s.externalIcon} />
                    </a>
                  </div>
                </label>
                <input
                  type="text"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className={s.inputRegular}
                  placeholder="https://maps.google.com/?q=Tempe+Arizona"
                />
              </div>
            </div>

            <div className={s.gridTwoColsPt1}>
              <div className={s.fieldGroup}>
                <label className={s.label}>
                  {t('churchInfoPhone')}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={s.inputRegular}
                  placeholder="(480) 555-0199"
                />
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>
                  {t('churchInfoEmail')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={s.inputRegular}
                  placeholder="contact@vrcfamily.org"
                />
              </div>
            </div>
          </Card>

          {/* Section: Church default Zoom meeting (admin-only) */}
          <Card variant="warm" padding="md" className="space-y-3">
            <h4 className={s.sectionTitle}>
              <Video className={s.zoomIcon} />
              <span>{t('churchInfoZoom')}</span>
            </h4>

            <div className={s.gridTwoColsPt1}>
              <div className={s.fieldGroup}>
                <label className={s.label}>
                  {t('churchInfoZoomId')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={zoomMeetingId}
                  onChange={(e) => setZoomMeetingId(e.target.value)}
                  className={s.inputRegular}
                  placeholder="e.g. 123 456 7890"
                />
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>
                  {t('churchInfoZoomPasscode')}
                </label>
                <input
                  type="password"
                  value={zoomPasscode}
                  onChange={(e) => setZoomPasscode(e.target.value)}
                  className={s.inputRegular}
                  placeholder="e.g. 123456"
                />
              </div>
            </div>

            <p className={s.hintText}>
              {t('churchInfoZoomHint')}
            </p>
          </Card>

          {/* Section 2: Weekly Service Times */}
          <div className={s.servicesSection}>
            <div className={s.servicesHeader}>
              <h4 className={s.sectionTitle}>
                <Clock className={s.clockIcon} />
                <span>{t('churchInfoSchedule')}</span>
              </h4>
              <AdminAddButton
                onClick={handleAddService}
                title={t('churchInfoAddService')}
              />
            </div>

            {services.length === 0 ? (
              <Card variant="subtle" padding="lg" className="border-dashed text-center space-y-2">
                <p className={s.emptyServicesText}>
                  {t('churchInfoNoServices')}
                </p>
                <Button
                  type="button"
                  variant="dark"
                  size="sm"
                  onClick={handleAddService}
                  leftIcon={<Plus className={s.plusIconSm} />}
                >
                  <span>{t('churchInfoAddServiceNew')}</span>
                </Button>
              </Card>
            ) : (
              services.map((svc, idx) => (
                <Card key={svc.id || idx} variant="subtle" padding="sm" className="space-y-2.5">
                  <div className={s.serviceCardHeader}>
                    <span className={s.serviceCardTitle}>
                      <CrossIcon className={s.serviceCrossIcon} />
                      <span>#{idx + 1}: {svc.titleVi || t('churchInfoNewService')}</span>
                    </span>
                    <AdminActionButtons
                      onDelete={() => handleDeleteService(idx)}
                    />
                  </div>

                  <div className={s.serviceGrid}>
                    <div className={s.subFieldGroup}>
                      <label className={s.subLabel}>
                        {t('churchInfoServiceNameVi')}
                      </label>
                      <input
                        type="text"
                        value={svc.titleVi}
                        onChange={(e) => updateServiceField(idx, 'titleVi', e.target.value)}
                        className={s.serviceInputSemibold}
                        placeholder="Lễ Thờ Phượng Chúa Nhật"
                      />
                    </div>

                    <div className={s.subFieldGroup}>
                      <div className={s.serviceCardHeader}>
                        <label className={s.subLabel}>
                          {t('churchInfoServiceTimeVi')}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={svc.time}
                        onChange={(e) => updateServiceField(idx, 'time', e.target.value)}
                        className={s.serviceInputAmber}
                        placeholder="Chúa Nhật • 3:00 PM – 5:00 PM"
                      />
                    </div>
                  </div>

                  <div className={s.serviceGridPt1}>
                    <div className={s.subFieldGroup}>
                      <label className={s.subLabel}>
                        {t('churchInfoServiceNameEn')}
                      </label>
                      <input
                        type="text"
                        value={svc.titleEn || ''}
                        onChange={(e) => updateServiceField(idx, 'titleEn', e.target.value)}
                        className={s.serviceInputRegular}
                        placeholder="Sunday Worship Service"
                      />
                    </div>

                    <div className={s.subFieldGroup}>
                      <label className={s.subLabel}>
                        {t('churchInfoServiceTimeEn')}
                      </label>
                      <input
                        type="text"
                        value={svc.timeEn || ''}
                        onChange={(e) => updateServiceField(idx, 'timeEn', e.target.value)}
                        className={s.serviceInputIndigo}
                        placeholder="Sunday • 3:00 PM – 5:00 PM"
                      />
                    </div>
                  </div>

                  <div className={s.subFieldGroup}>
                    <label className={s.subLabel}>
                      {t('churchInfoDesc')}
                    </label>
                    <textarea
                      rows={2}
                      value={svc.descVi}
                      onChange={(e) => updateServiceField(idx, 'descVi', e.target.value)}
                      className={s.serviceTextarea}
                      placeholder="Tôn vinh Chúa, cầu nguyện và lắng nghe Lời Chúa..."
                    />
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className={s.footer}>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('commonCancel')}
            </Button>
            <Button
              type="submit"
              variant="dark"
              disabled={saving}
              leftIcon={<Save className={s.plusIconSm} />}
            >
              <span>{saving ? t('commonSaving') : t('commonSaveChanges')}</span>
            </Button>
          </div>
        </form>
    </Modal>
  );
};
