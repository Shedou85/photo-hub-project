import { useRef } from 'react';
import clsx from 'clsx';

/**
 * UploadZone component for file uploads with drag-drop support
 *
 * @param {object} props - Component props
 * @param {function} props.onFilesSelected - Callback receiving FileList when files chosen
 * @param {string[]} [props.accept=['image/jpeg', 'image/png', 'image/webp']] - Accepted MIME types
 * @param {boolean} [props.multiple=true] - Allow multi-file selection
 * @param {boolean} [props.dragOver=false] - External drag-over state from parent
 * @param {function} [props.onDragOver] - Drag over callback
 * @param {function} [props.onDragLeave] - Drag leave callback
 * @param {function} [props.onDrop] - Drop callback
 * @param {'default' | 'compact'} [props.variant='default'] - Display variant
 * @param {string} [props.label] - Primary text label
 * @param {string} [props.hint] - Secondary hint text
 * @param {'blue' | 'green'} [props.theme='blue'] - Color theme
 *
 * @example
 * // Default large dropzone with drag-drop handlers
 * <UploadZone
 *   onFilesSelected={handleFiles}
 *   dragOver={dragOver}
 *   onDragOver={handleDragOver}
 *   onDragLeave={handleDragLeave}
 *   onDrop={handleDrop}
 *   label={t('collection.uploadZoneLabel')}
 *   hint={t('collection.uploadZoneHint')}
 * />
 *
 * @example
 * // Compact button variant for "Add More Photos"
 * <UploadZone
 *   variant="compact"
 *   onFilesSelected={handleFiles}
 *   label={t('collection.addMorePhotos')}
 * />
 *
 * @example
 * // Green-themed dropzone for edited photo uploads
 * <UploadZone
 *   onFilesSelected={handleEditedFiles}
 *   theme="green"
 *   label="Upload edited photos"
 *   hint="JPEG, PNG, or WebP"
 * />
 */
function UploadZone({
  onFilesSelected,
  accept = ['image/jpeg', 'image/png', 'image/webp'],
  multiple = true,
  dragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  variant = 'default',
  label,
  hint,
  theme = 'blue'
}) {
  const fileInputRef = useRef(null);

  // Theme classes object
  const themeClasses = {
    blue: {
      border: dragOver ? 'border-indigo-500' : 'border-white/[0.15] hover:border-indigo-500/50',
      bg: dragOver ? 'bg-indigo-500/10' : 'bg-white/[0.02] hover:bg-white/[0.04]',
      icon: dragOver ? 'text-indigo-400' : 'text-white/40',
    },
    green: {
      border: 'border-green-500/30 hover:border-green-500/50',
      bg: 'bg-green-500/5',
      icon: 'text-green-400',
    }
  };

  // Handlers
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleClick();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = ''; // Reset to allow re-upload of same file
    }
  };

  // Compact variant rendering
  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 py-2.5 px-5 text-sm font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-sm hover:bg-indigo-500/20 transition-colors cursor-pointer font-sans"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {label}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          multiple={multiple}
          className="hidden"
          onChange={handleFileChange}
        />
      </>
    );
  }

  // Default variant rendering
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={clsx(
          'border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors select-none',
          themeClasses[theme].border,
          themeClasses[theme].bg
        )}
      >
        <svg className={clsx('w-9 h-9', themeClasses[theme].icon)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="m-0 text-sm font-medium text-white/60">{label}</p>
        {hint && <p className="m-0 text-xs text-white/40">{hint}</p>}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(',')}
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}

export default UploadZone;
