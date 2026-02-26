import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './primitives/Button';

function CreateCollectionModal({ onClose, onSubmit, disabled = false }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !submitting) onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [submitting, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        clientName: clientName.trim() || null,
        clientEmail: clientEmail.trim() || null,
      });
    } catch {
      // Error is handled by the caller via toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-collection-modal-title"
    >
      <div className="bg-surface-dark border border-white/10 rounded-[10px] shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <h2 id="create-collection-modal-title" className="text-lg font-bold text-white m-0">
            {t('collections.createTitle')}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/60 transition-colors focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
            aria-label={t('common.cancel')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label htmlFor="modal-collection-name" className="block mb-1.5 text-sm font-semibold text-white/60">
                {t('collections.nameLabel')}
              </label>
              <input
                id="modal-collection-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                className="w-full py-2.5 px-4 text-sm text-white bg-white/[0.06] border border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] focus:ring-2 focus:ring-indigo-500/20 rounded-lg outline-none transition-all duration-150 placeholder:text-white/20"
                placeholder={t('collections.nameLabel')}
              />
            </div>
            <div>
              <label htmlFor="modal-client-name" className="block mb-1.5 text-sm font-semibold text-white/60">
                {t('collections.clientNameLabel')} <span className="font-normal text-white/30">({t('collections.optional')})</span>
              </label>
              <input
                id="modal-client-name"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full py-2.5 px-4 text-sm text-white bg-white/[0.06] border border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] focus:ring-2 focus:ring-indigo-500/20 rounded-lg outline-none transition-all duration-150 placeholder:text-white/20"
                placeholder={t('collections.clientNamePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="modal-client-email" className="block mb-1.5 text-sm font-semibold text-white/60">
                {t('collections.clientEmailLabel')} <span className="font-normal text-white/30">({t('collections.optional')})</span>
              </label>
              <input
                id="modal-client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full py-2.5 px-4 text-sm text-white bg-white/[0.06] border border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] focus:ring-2 focus:ring-indigo-500/20 rounded-lg outline-none transition-all duration-150 placeholder:text-white/20"
                placeholder={t('collections.clientEmailPlaceholder')}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={!name.trim() || submitting || disabled}>
              {submitting ? t('collections.creating') : t('collections.createBtn')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCollectionModal;
