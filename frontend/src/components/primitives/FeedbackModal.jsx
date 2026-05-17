import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

const FeedbackModal = ({ onClose }) => {
  const { t } = useTranslation();
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const validate = () => {
    const e = {};
    if (!type) e.type = t('feedback.typeRequired');
    if (!subject.trim()) e.subject = t('feedback.subjectRequired');
    if (!description.trim()) e.description = t('feedback.descriptionRequired');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    const { error } = await api.post('/feedback', { type, subject: subject.trim(), description: description.trim() });
    setLoading(false);
    if (error) { setErrors({ form: t('feedback.errorMessage') }); return; }
    setSuccess(true);
    setTimeout(() => onClose(), 2000);
  };

  const inputClass = (field) =>
    `w-full bg-white/[0.06] border ${errors[field] ? 'border-red-500/60' : 'border-white/[0.12]'} rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/70 focus:bg-white/[0.08] transition-colors`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-surface-dark border border-white/10 rounded-[10px] shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.08]">
          <h2 className="text-white font-semibold text-base m-0">{t('feedback.modalTitle')}</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold m-0">{t('feedback.successTitle')}</p>
            <p className="text-white/50 text-sm m-0">{t('feedback.successMessage')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5 flex flex-col gap-4">

              {/* Type selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setType('BUG'); setErrors((e) => ({ ...e, type: undefined })); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      type === 'BUG'
                        ? 'bg-red-500/15 border-red-500/40 text-red-300'
                        : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.07]'
                    }`}
                  >
                    <span>🐛</span> {t('feedback.typeBug')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('FEATURE'); setErrors((e) => ({ ...e, type: undefined })); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      type === 'FEATURE'
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                        : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.07]'
                    }`}
                  >
                    <span>💡</span> {t('feedback.typeFeature')}
                  </button>
                </div>
                {errors.type && <p className="text-red-400 text-xs m-0">{errors.type}</p>}
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{t('feedback.subjectLabel')}</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setErrors((err) => ({ ...err, subject: undefined })); }}
                  placeholder={t('feedback.subjectPlaceholder')}
                  maxLength={255}
                  className={inputClass('subject')}
                />
                {errors.subject && <p className="text-red-400 text-xs m-0">{errors.subject}</p>}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{t('feedback.descriptionLabel')}</label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setErrors((err) => ({ ...err, description: undefined })); }}
                  placeholder={t('feedback.descriptionPlaceholder')}
                  rows={4}
                  className={`${inputClass('description')} resize-none`}
                />
                {errors.description && <p className="text-red-400 text-xs m-0">{errors.description}</p>}
              </div>

              {errors.form && <p className="text-red-400 text-sm text-center m-0">{errors.form}</p>}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? t('feedback.submitting') : t('feedback.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
