import React, { useRef, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { uploadStyles } from './Upload.styles.ts';

// File types that are never accepted, even if a caller lists them in
// `accept` by mistake. Archives and executables are the main risk: a
// .zip could hide anything, and an executable must never be uploaded.
// (.docx is NOT a zip here — it is opened only by the Word parser,
// which reads its text; it is never extracted as an archive.)
const BLOCKED_EXTENSIONS = new Set([
  '.zip',
  '.rar',
  '.7z',
  '.tar',
  '.gz',
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.js',
  '.html',
  '.htm',
]);

// MIME types that are never accepted. The extension allowlist is the
// primary gate (browsers report odd MIME types for .csv/.txt), so
// this only blocks the clearly dangerous ones.
const BLOCKED_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-msdownload',
  'application/x-sh',
  'application/x-msdos-program',
]);

export interface UploadProps {
  // Allowed file extensions, e.g. ['.csv', '.txt', '.docx']. Shown to
  // the user and enforced by the file picker and on select/drop.
  accept: string[];
  // Max file size in megabytes (default 5). The server enforces its
  // own limit too — this is only the early, friendly check.
  maxSizeMB?: number;
  // The chosen file (null when none). The parent owns the file state
  // and clears it after a successful import.
  file: File | null;
  // Called with the validated file, or null when the file is removed.
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  // Short hint shown under the dropzone (e.g. the expected format).
  hint?: string;
  // Heading shown inside the dropzone.
  label?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const Upload: React.FC<UploadProps> = ({
  accept,
  maxSizeMB = 5,
  file,
  onFileChange,
  disabled = false,
  hint,
  label,
}) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const allowedExtensions = accept.map((ext) => ext.toLowerCase());
  const acceptAttr = allowedExtensions.join(',');

  const validateFile = (candidate: File): string | null => {
    if (candidate.size === 0) return t('uploadFileEmpty');
    if (candidate.size > maxSizeMB * 1024 * 1024) {
      return t('uploadFileTooBig', { size: maxSizeMB });
    }
    const dotIndex = candidate.name.lastIndexOf('.');
    const extension = dotIndex >= 0 ? candidate.name.slice(dotIndex).toLowerCase() : '';
    if (!extension || BLOCKED_EXTENSIONS.has(extension)) {
      return t('uploadFileTypeNotAllowed', { types: allowedExtensions.join(', ') });
    }
    if (!allowedExtensions.includes(extension)) {
      return t('uploadFileTypeNotAllowed', { types: allowedExtensions.join(', ') });
    }
    if (candidate.type && BLOCKED_MIME_TYPES.has(candidate.type.toLowerCase())) {
      return t('uploadFileTypeNotAllowed', { types: allowedExtensions.join(', ') });
    }
    return null;
  };

  const handleCandidate = (candidate: File | undefined) => {
    if (!candidate || disabled) return;
    const error = validateFile(candidate);
    if (error) {
      setLocalError(error);
      return;
    }
    setLocalError(null);
    onFileChange(candidate);
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleCandidate(event.target.files?.[0]);
    // Reset the input so the same file can be picked again after
    // being removed or rejected.
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    handleCandidate(event.dataTransfer.files?.[0]);
  };

  const handleRemove = () => {
    if (disabled) return;
    setLocalError(null);
    onFileChange(null);
  };

  const dropzoneClassName = [
    uploadStyles.dropzone,
    dragOver ? uploadStyles.dropzoneDragOver : '',
    disabled ? uploadStyles.dropzoneDisabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={uploadStyles.wrapper}>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label || t('uploadDropLabel')}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={dropzoneClassName}
      >
        <UploadCloud className={uploadStyles.dropzoneIcon} aria-hidden="true" />
        <span className={uploadStyles.dropzoneTitle}>
          {label || t('uploadDropLabel')}
        </span>
        <span className={uploadStyles.dropzoneSubtitle}>
          {t('uploadAcceptedTypes', { types: allowedExtensions.join(', ') })}
        </span>
        <span className={uploadStyles.chooseButton}>
          {t('uploadChooseFile')}
        </span>
      </div>

      {hint && <p className={uploadStyles.hint}>{hint}</p>}

      {file && (
        <div className={uploadStyles.fileChip}>
          <FileText className={uploadStyles.fileIcon} aria-hidden="true" />
          <span className={uploadStyles.fileName}>{file.name}</span>
          <span className={uploadStyles.fileSize}>{formatFileSize(file.size)}</span>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label={t('uploadRemoveFile')}
            className={uploadStyles.removeButton}
          >
            <X className={uploadStyles.removeIcon} aria-hidden="true" />
          </button>
        </div>
      )}

      {localError && (
        <p className={uploadStyles.errorText} role="alert">
          {localError}
        </p>
      )}
    </div>
  );
};
