import React from 'react';
import { Download, Plus, UploadCloud } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { Button, Banner, ConfirmModal, Modal, Upload } from '../../../../common-component/index.ts';
import { verseUploadSectionStyles } from './VerseUploadSection.styles.ts';

// A verse validated by POST /api/verse-pool/upload (preview step),
// ready to import. The backend returns canonical references from
// the Bible API, so these are what gets stored on confirm.
export interface UploadPreviewVerse {
  reference: string;
  referenceEn: string;
  referenceVi: string;
  reflection: string;
  reflectionEn: string;
  reflectionVi: string;
  prayer: string | null;
  prayerEn: string | null;
  prayerVi: string | null;
}

export interface UploadPreview {
  month: string;
  daysInMonth: number;
  verses: UploadPreviewVerse[];
  warnings: Array<{ code: string; daysInMonth: number; count: number }>;
  existingCount: number;
}

export interface UploadRowError {
  row: number;
  message: string;
}

interface VerseUploadSectionProps {
  // The month the upload is for (the pool month being viewed).
  viewMonth: string;
  uploadFile: File | null;
  onUploadFileChange: (file: File | null) => void;
  uploadPreview: UploadPreview | null;
  uploadErrors: UploadRowError[];
  onDismissUploadError: (index: number) => void;
  uploadChecking: boolean;
  uploadImporting: boolean;
  uploadSuccess: string | null;
  // The sample format modal (opens automatically when an upload
  // fails, or from the "Download template" area).
  showSampleModal: boolean;
  onShowSampleModalChange: (open: boolean) => void;
  // The Replace confirm modal (uploading for a month that already
  // has pool verses).
  showReplaceConfirm: boolean;
  onShowReplaceConfirmChange: (open: boolean) => void;
  onCheckFile: () => void;
  onImport: (replace: boolean) => void;
  onDownloadTemplate: () => void;
  // Pick the current language's text, falling back to the other
  // language, then to the generic field — same helper as DailyVerseCard.
  pick: (vi?: string | null, en?: string | null, fallback?: string | null) => string;
  // "Tháng 12, 2026" / "December 2026" for a YYYY-MM string.
  formatMonthLabel: (month: string, language: 'vi' | 'en') => string;
}

// The "Upload Monthly Verses" area: month line, file picker, Check
// File, preview table, Import, plus the sample format modal and the
// Replace confirm modal (both belong to the upload flow). All state
// and API calls live in VersesTab; this child only renders the
// section and calls back.
export const VerseUploadSection: React.FC<VerseUploadSectionProps> = ({
  viewMonth,
  uploadFile,
  onUploadFileChange,
  uploadPreview,
  uploadErrors,
  onDismissUploadError,
  uploadChecking,
  uploadImporting,
  uploadSuccess,
  showSampleModal,
  onShowSampleModalChange,
  showReplaceConfirm,
  onShowReplaceConfirmChange,
  onCheckFile,
  onImport,
  onDownloadTemplate,
  pick,
  formatMonthLabel,
}) => {
  const { t, language } = useLanguage();

  return (
    <>
      <p className={verseUploadSectionStyles.uploadMonthLine}>
        {t('poolUploadMonthFilter')} {formatMonthLabel(viewMonth, language)}
      </p>
      <p className={verseUploadSectionStyles.hint}>{t('poolUploadHint')}</p>
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDownloadTemplate}
          leftIcon={<Download className={verseUploadSectionStyles.saveIcon} />}
        >
          <span>{t('poolUploadDownloadTemplate')}</span>
        </Button>
      </div>
      <Upload
        accept={['.csv', '.txt', '.docx']}
        maxSizeMB={5}
        file={uploadFile}
        onFileChange={onUploadFileChange}
        disabled={uploadChecking || uploadImporting}
      />
      <div className={verseUploadSectionStyles.uploadBtnRow}>
        <Button
          type="button"
          variant="dark"
          size="md"
          fullWidth
          onClick={onCheckFile}
          loading={uploadChecking}
          disabled={uploadChecking || uploadImporting || !uploadFile}
          leftIcon={<UploadCloud className={verseUploadSectionStyles.saveIcon} />}
        >
          <span>{uploadChecking ? t('poolUploadChecking') : t('poolUploadCheckFile')}</span>
        </Button>
      </div>

      {uploadErrors.length > 0 && (
        <div className={verseUploadSectionStyles.uploadErrorStack}>
          {uploadErrors.map((uploadError, index) => (
            <Banner
              key={`${uploadError.row}-${index}`}
              type="error"
              message={t('poolUploadRowError', { row: uploadError.row, message: uploadError.message })}
              onDismiss={() => onDismissUploadError(index)}
            />
          ))}
        </div>
      )}

      {uploadPreview && (
        <>
          <div className={verseUploadSectionStyles.formHeader}>
            <h4 className={verseUploadSectionStyles.sectionTitle}>
              {t('poolUploadPreviewTitle', {
                count: uploadPreview.verses.length,
                month: formatMonthLabel(uploadPreview.month, language),
              })}
            </h4>
          </div>
          {uploadPreview.warnings.map((warning) => (
            <Banner
              key={warning.code}
              type="info"
              message={
                warning.code === 'fewer-than-days'
                  ? t('poolUploadCountWarning', {
                      month: formatMonthLabel(uploadPreview.month, language),
                      days: warning.daysInMonth,
                      count: warning.count,
                    })
                  : t('poolUploadCountExtra', {
                      month: formatMonthLabel(uploadPreview.month, language),
                      days: warning.daysInMonth,
                      count: warning.count,
                    })
              }
            />
          ))}
          <div className={verseUploadSectionStyles.uploadPreviewList}>
            {uploadPreview.verses.map((previewVerse) => (
              <div key={previewVerse.referenceEn} className={verseUploadSectionStyles.uploadPreviewRow}>
                <p className={verseUploadSectionStyles.uploadPreviewRef}>
                  {pick(previewVerse.referenceVi, previewVerse.referenceEn, previewVerse.reference)}
                </p>
                {(pick(previewVerse.reflectionVi, previewVerse.reflectionEn, previewVerse.reflection) ||
                  pick(previewVerse.prayerVi, previewVerse.prayerEn, previewVerse.prayer)) && (
                  <p className={verseUploadSectionStyles.uploadPreviewMeta}>
                    {pick(previewVerse.reflectionVi, previewVerse.reflectionEn, previewVerse.reflection) ||
                      pick(previewVerse.prayerVi, previewVerse.prayerEn, previewVerse.prayer)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className={verseUploadSectionStyles.uploadBtnRow}>
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              onClick={() => onImport(false)}
              loading={uploadImporting}
              disabled={uploadImporting}
              leftIcon={<Plus className={verseUploadSectionStyles.saveIcon} />}
            >
              <span>
                {uploadImporting
                  ? t('poolUploadImporting')
                  : t('poolUploadImport', { count: uploadPreview.verses.length })}
              </span>
            </Button>
          </div>
        </>
      )}

      {uploadSuccess && <Banner type="success" message={uploadSuccess} />}

      {/* Sample format modal — opened from the upload section, and
          automatically when an upload fails. */}
      <Modal
        isOpen={showSampleModal}
        onClose={() => onShowSampleModalChange(false)}
        title={t('poolUploadSampleTitle')}
        maxWidthClass="max-w-lg"
      >
        <div className={verseUploadSectionStyles.uploadSampleModalBody}>
          <div className={verseUploadSectionStyles.uploadSampleTable}>
            <div className={verseUploadSectionStyles.uploadSampleHeaderRow}>
              <span>reference_en</span>
              <span>reference_vi</span>
              <span>reflection_en</span>
              <span>reflection_vi</span>
              <span>prayer_en</span>
              <span>prayer_vi</span>
            </div>
            <div className={verseUploadSectionStyles.uploadSampleDataRow}>
              <span>John 3:16</span>
              <span>Giăng 3:16</span>
              <span>God loved the world…</span>
              <span>Đức Chúa Trời yêu thế gian…</span>
              <span>Thank You Lord…</span>
              <span>Lạy Chúa, cảm tạ Ngài…</span>
            </div>
          </div>
          <p className={verseUploadSectionStyles.hint}>{t('poolUploadSampleNote')}</p>
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDownloadTemplate}
              leftIcon={<Download className={verseUploadSectionStyles.saveIcon} />}
            >
              <span>{t('poolUploadDownloadTemplate')}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Replace confirm — uploading for a month that already has verses */}
      <ConfirmModal
        isOpen={showReplaceConfirm}
        title={t('poolUploadReplaceTitle', { count: uploadPreview?.existingCount ?? 0 })}
        message={
          uploadPreview
            ? t('poolUploadReplaceBody', {
                month: formatMonthLabel(uploadPreview.month, language),
                count: uploadPreview.existingCount,
              })
            : ''
        }
        confirmText={t('poolUploadReplaceConfirm')}
        cancelText={t('poolUploadCancel')}
        loading={uploadImporting}
        onConfirm={() => onImport(true)}
        onCancel={() => onShowReplaceConfirmChange(false)}
      />
    </>
  );
};
