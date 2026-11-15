import React, { useEffect, useRef, useState } from 'react';
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
  Plus,
  Video,
} from 'lucide-react';
import { Card, Button, Banner, AdminActionButtons, AdminAddButton, TextField } from '../../common-component/index.ts';
import { churchInfoFormStyles as s } from './ChurchInfoForm.styles.ts';

interface ChurchInfoFormProps {
  churchInfo?: ChurchInfo | null;
  onSaved: (updated: ChurchInfo) => void;
  // Optional — the modal passes its onClose (Cancel closes the popup);
  // the AdminPortal tab omits it (nothing to close, only Save).
  onCancel?: () => void;
}

// Snapshot of the form values, for dirty-checking: the Save button
// is only enabled when a field differs from the last saved values.
type ChurchInfoFormValues = {
  sanctuaryName: string;
  address: string;
  googleMapsUrl: string;
  phone: string;
  email: string;
  regionDescVi: string;
  regionDescEn: string;
  zoomMeetingId: string;
  zoomPasscode: string;
  services: WeeklyService[];
};

const getFormValues = (info: ChurchInfo): ChurchInfoFormValues => ({
  sanctuaryName: info.sanctuaryName || 'Hội Thánh Tin Lành Báp-tít Phục Hưng',
  address: info.address || '1565 E Warner Rd, Tempe AZ 85284',
  googleMapsUrl: info.googleMapsUrl || 'https://maps.google.com/?q=1565+E+Warner+Rd,+Tempe+AZ+85284',
  phone: info.phone || '(480) 555-0199',
  email: info.email || 'htph@vrcfamily.org',
  regionDescVi: info.regionDescVi || 'Phục vụ cộng đồng người Việt tại Tempe, Phoenix, Mesa, Chandler & Gilbert',
  regionDescEn: info.regionDescEn || 'Serving Vietnamese communities across Phoenix East Valley',
  zoomMeetingId: info.zoomMeetingId || '',
  zoomPasscode: info.zoomPasscode || '',
  services: info.services ? JSON.parse(JSON.stringify(info.services)) : [...DEFAULT_CHURCH_INFO.services],
});

export const ChurchInfoForm: React.FC<ChurchInfoFormProps> = ({
  churchInfo,
  onSaved,
  onCancel,
}) => {
  const { getToken } = useAuth();
  const { t } = useLanguage();

  const safeInfo = churchInfo || DEFAULT_CHURCH_INFO;
  const initialValues = getFormValues(safeInfo);

  const [sanctuaryName, setSanctuaryName] = useState(initialValues.sanctuaryName);
  const [address, setAddress] = useState(initialValues.address);
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialValues.googleMapsUrl);
  const [phone, setPhone] = useState(initialValues.phone);
  const [email, setEmail] = useState(initialValues.email);
  const [regionDescVi, setRegionDescVi] = useState(initialValues.regionDescVi);
  const [regionDescEn, setRegionDescEn] = useState(initialValues.regionDescEn);
  // Church default Zoom meeting (used by the shared Zoom button on
  // events). Admin-only: these values are never rendered anywhere
  // else in the app.
  const [zoomMeetingId, setZoomMeetingId] = useState(initialValues.zoomMeetingId);
  const [zoomPasscode, setZoomPasscode] = useState(initialValues.zoomPasscode);

  const [services, setServices] = useState<WeeklyService[]>(initialValues.services);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Success message shown below the save button (mobile only) after a
  // save completes. The banner above lives at the top of this long
  // form, far from the save button on a phone. Clears after 4s.
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  // Error message shown below the save button (mobile only) when a save
  // fails. Unlike success, it does NOT auto-hide.
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveSuccessTimeout = useRef<number | null>(null);

  // Last saved values — the Save button is enabled only while the
  // form differs from these.
  const initialRef = useRef<ChurchInfoFormValues>(initialValues);
  // Success feedback auto-hides after 4s; errors stay until dismissed.
  const feedbackTimeout = useRef<number | null>(null);

  const syncForm = (info: ChurchInfo) => {
    const values = getFormValues(info);
    setSanctuaryName(values.sanctuaryName);
    setAddress(values.address);
    setGoogleMapsUrl(values.googleMapsUrl);
    setPhone(values.phone);
    setEmail(values.email);
    setRegionDescVi(values.regionDescVi);
    setRegionDescEn(values.regionDescEn);
    setZoomMeetingId(values.zoomMeetingId);
    setZoomPasscode(values.zoomPasscode);
    setServices(values.services);
    initialRef.current = values;
  };

  // Re-sync whenever the saved church info changes (after a save, or
  // when it loads). The modal remounts this form on every open, so it
  // always starts fresh there; the tab keeps it mounted and re-syncs
  // here.
  useEffect(() => {
    syncForm(churchInfo || DEFAULT_CHURCH_INFO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchInfo]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    if (feedbackTimeout.current) {
      window.clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }
    setFeedback({ type, message });
    if (type === 'success') {
      feedbackTimeout.current = window.setTimeout(() => setFeedback(null), 4000);
    }
  };

  const dismissFeedback = () => {
    if (feedbackTimeout.current) {
      window.clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }
    setFeedback(null);
  };

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

  // Dirty-check: any field differs from the last saved values, or the
  // services list changed. The Save button stays disabled until then.
  const initial = initialRef.current;
  const isDirty =
    sanctuaryName !== initial.sanctuaryName ||
    address !== initial.address ||
    googleMapsUrl !== initial.googleMapsUrl ||
    phone !== initial.phone ||
    email !== initial.email ||
    regionDescVi !== initial.regionDescVi ||
    regionDescEn !== initial.regionDescEn ||
    zoomMeetingId !== initial.zoomMeetingId ||
    zoomPasscode !== initial.zoomPasscode ||
    JSON.stringify(services) !== JSON.stringify(initial.services);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanctuaryName.trim() || !address.trim()) {
      showFeedback('error', t('churchInfoFillBoth'));
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      setSaveSuccess(null);
      setSaveError(null);
      if (saveSuccessTimeout.current) {
        window.clearTimeout(saveSuccessTimeout.current);
        saveSuccessTimeout.current = null;
      }
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
      } catch (err) {
        console.warn('Could not write church info to localStorage:', err);
      }
      // The saved values are now the clean baseline — Save disables
      // again until the next edit.
      initialRef.current = getFormValues(savedData);
      showFeedback('success', t('churchInfoSaved'));
      setSaveSuccess(t('churchInfoSaved'));
      saveSuccessTimeout.current = window.setTimeout(() => setSaveSuccess(null), 4000);
      onSaved(savedData);
    } catch (err: any) {
      console.error('Error saving church info:', err);
      const saveErrorMessage = err.message || t('churchInfoSaveFailed');
      showFeedback('error', saveErrorMessage);
      setSaveError(saveErrorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Feedback alert — success auto-hides, errors stay until dismissed */}
      {feedback && (
        <Banner
          type={feedback.type}
          message={feedback.message}
          onDismiss={dismissFeedback}
        />
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

                <div className={s.fieldGroup}>
                  <span className={s.fieldLabel}>{t('churchInfoServiceNameLabel')}</span>
                  <TextField
                    label={t('commonLangVi')}
                    value={svc.titleVi}
                    onChange={(value) => updateServiceField(idx, 'titleVi', value)}
                    placeholder="Lễ Thờ Phượng Chúa Nhật"
                  />
                  <TextField
                    label={t('commonLangEn')}
                    value={svc.titleEn || ''}
                    onChange={(value) => updateServiceField(idx, 'titleEn', value)}
                    placeholder="Sunday Worship Service"
                  />
                </div>

                <div className={s.fieldGroup}>
                  <span className={s.fieldLabel}>{t('churchInfoServiceTimeLabel')}</span>
                  <TextField
                    label={t('commonLangVi')}
                    value={svc.time}
                    onChange={(value) => updateServiceField(idx, 'time', value)}
                    placeholder="Chúa Nhật • 3:00 PM – 5:00 PM"
                  />
                  <TextField
                    label={t('commonLangEn')}
                    value={svc.timeEn || ''}
                    onChange={(value) => updateServiceField(idx, 'timeEn', value)}
                    placeholder="Sunday • 3:00 PM – 5:00 PM"
                  />
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

        {/* Footer Submit Buttons — Save is disabled until a field changes */}
        <div className={s.footer}>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              {t('commonCancel')}
            </Button>
          )}
          <Button
            type="submit"
            variant="dark"
            loading={saving}
            disabled={saving || !isDirty}
            leftIcon={<Save className={s.plusIconSm} />}
          >
            <span>{saving ? t('commonSaving') : t('commonSaveChanges')}</span>
          </Button>
        </div>
        {saveSuccess && (
          <Banner type="success" message={saveSuccess} className="md:hidden mt-2" />
        )}
        {saveError && (
          <Banner
            type="error"
            message={saveError}
            className="md:hidden mt-2"
            onDismiss={() => setSaveError(null)}
          />
        )}
      </form>
    </>
  );
};
