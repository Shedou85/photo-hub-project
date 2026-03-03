import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const MS_PER_DAY = 86_400_000;

function TrialExpiredModal({ user, onClose }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const storageKey = `trial_expired_seen_${user?.id}`;

  const handleDismiss = useCallback(() => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
    onClose?.();
  }, [storageKey, onClose]);

  useEffect(() => {
    if (!user?.id) return;
    if (localStorage.getItem(storageKey)) return;
    setVisible(true);
  }, [user?.id, storageKey]);

  useEffect(() => {
    if (!visible) return;
    const handler = (e) => { if (e.key === 'Escape') handleDismiss(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [visible, handleDismiss]);

  if (!visible) return null;

  const graceDaysLeft = user?.planDowngradedAt
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(user.planDowngradedAt).getTime()) / MS_PER_DAY))
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-expired-modal-title"
    >
      <div className="bg-surface-dark border border-white/10 rounded-[10px] shadow-xl w-full max-w-md mx-4 px-6 py-6 animate-scale-in">
        {/* Clock icon */}
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h3 id="trial-expired-modal-title" className="text-base font-semibold text-white mb-1 text-center">
          {t('plans.trialExpiredModal.title')}
        </h3>
        <p className="text-sm text-white/50 mb-5 text-center leading-relaxed">
          {t('plans.trialExpiredModal.subtitle')}
        </p>

        {/* What changed list */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-start gap-3 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <svg className="w-4 h-4 text-white/40 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <span className="text-sm text-white/70">{t('plans.trialExpiredModal.collectionsLimit', { limit: 5, oldLimit: 20 })}</span>
          </div>

          <div className="flex items-start gap-3 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <svg className="w-4 h-4 text-white/40 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-sm text-white/70">{t('plans.trialExpiredModal.photosLimit', { limit: 30, oldLimit: 500 })}</span>
          </div>

          <div className="flex items-start gap-3 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <svg className={`w-4 h-4 mt-0.5 shrink-0 ${graceDaysLeft > 0 ? 'text-green-400/60' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-white/70">
              {graceDaysLeft > 0
                ? t('plans.trialExpiredModal.selectionsGrace', { days: graceDaysLeft })
                : t('plans.trialExpiredModal.selectionsExpired')
              }
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link
            to="/payments"
            onClick={handleDismiss}
            className="block w-full py-2.5 px-4 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:brightness-110 text-white text-sm font-semibold rounded-lg transition-all shadow-[0_4px_16px_rgba(99,102,241,0.35)] text-center"
          >
            {t('plans.trialExpiredModal.viewPlans')}
          </Link>
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            {t('plans.trialExpiredModal.continueFree')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrialExpiredModal;
